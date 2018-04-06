#!/usr/bin/python3
import sys
import datetime
import serverboards
import yaml
from serverboards import rpc, print
from pcolor import printc

td_to_s_multiplier = [
    ("ms", 0.001),
    ("s", 1),
    ("m", 60),
    ("h", 60 * 60),
    ("d", 24 * 60 * 60),
]


def time_description_to_seconds(td):
    if type(td) in (int, float):
        return float(td)
    for sufix, multiplier in td_to_s_multiplier:
        if td.endswith(sufix):
            return float(td[:-len(sufix)]) * multiplier
    return float(td)


class Connection:
    conn = False
    port = None
    ssh_plugin_id = None

    @staticmethod
    def serialize(x):
        if type(x) == datetime.datetime:
            return x.isoformat()
        return x

    def execute(self, query, data=None):
        with self.conn.cursor() as cur:
            try:
                cur.execute(query, data)
                if cur.description:
                    return {
                        "columns": [x[0] for x in cur.description],
                        "data": [[self.serialize(y) for y in x]
                                 for x in cur.fetchall()]
                    }
                return {
                    "columns": "message",
                    "data": [[cur.statusmessage]]
                }
            except Exception:
                conn.conn.rollback()
                raise
            finally:
                conn.conn.commit()

    def close(self):
        print("closed conn", self.conn)
        self.conn.close()

    def connect_port(self, via, hostname, port):
        rpc.debug("Connection via %s" % via)
        with serverboards.Plugin("serverboards.core.ssh/daemon") as ssh:
            self.port = ssh.open_port(
                service=via, hostname=hostname, port=port)
        rpc.debug("Use port  %s" % self.port)
        hostname = "localhost"
        return (hostname, self.port)


class PostgreSQL(Connection):

    def __init__(self, via, hostname, port, username, password_pw, database):
        import psycopg2
        super().__init__()
        if via or hostname != "localhost":
            hostname, port = self.connect_port(via, hostname, port)
        self.conn = psycopg2.connect(
            database=database, user=username,
            password=password_pw, host=hostname, port=port)
        self.conn.autocommit = True  # no transaction at start
        self.database = database

    def databases(self):
        return [
            x[0] for x in
            execute("SELECT datname FROM pg_database WHERE datistemplate = false;")[
                'data']
        ]

    def tables(self):
        return [
            x[0] for x in
            execute("SELECT relname FROM pg_class WHERE relkind='r' AND relname !~ '^(pg_|sql_)';")[
                'data']
        ]

    def columns(self, table):
        return [
            x[0] for x in
            self.execute(
                "SELECT column_name FROM information_schema.columns WHERE table_catalog = %s AND table_name = %s"
                , [self.database, table])['data']
        ]


class MySQL(Connection):

    def __init__(self, via, hostname, port, username, password_pw, database):
        import MySQLdb
        super().__init__()
        if via:
            hostname, port = self.connect_port(via, hostname, port)
        self.conn = MySQLdb.connect(
            db=database, user=username, passwd=password_pw,
            host=hostname, port=port)

    def databases(self):
        return [
            x[0] for x in
            execute("SHOW DATABASES;")["data"]
        ]

    def tables(self):
        return [
            x[0] for x in
            execute("SHOW TABLES;")["data"]
        ]


conn = False
conn_desc = ()


@serverboards.rpc_method("open")
def open_(service_id, database=None):
    global conn
    global conn_desc
    new_conn_desc = (service_id, database)

    if conn and conn_desc == new_conn_desc:
        return True

    # get config from service
    config = serverboards.service.get(service_id).get("config")

    via = config.get("via")
    type = config.get("type", "postgresql")
    hostname = config.get("hostname", "localhost")
    port = config.get("port", None)
    username = config.get("username", None)
    password_pw = config.get("password_pw", None)

    # if conn, close it
    if conn:
        conn.close()
        if conn.ssh_plugin_id:
            rpc.call("%s.close_port" % conn.ssh_plugin_id, port=conn.port)
        conn.conn = None
        conn.port = None
        conn_desc = ()

    hostname = hostname or "localhost"

    if type == "postgresql" or type == "postgres":
        port = port or 5432
        database = database or "template1"
        conn = PostgreSQL(via, hostname, port, username, password_pw, database)
        conn_desc = new_conn_desc
        return True
    if type == "mysql":
        port = port or 3306
        database = database or "mysql"
        conn = MySQL(via, hostname, port, username, password_pw, database)
        conn_desc = new_conn_desc
        return True

    raise Exception("Database type %s not supported" % (type))
    return True


@serverboards.rpc_method
def close():
    global conn
    global conn_desc
    conn.close()
    conn_desc = ()
    if conn.ssh_plugin_id:
        rpc.call("%s.close_port" % conn.ssh_plugin_id, port=conn.port)
    sys.exit(0)


@serverboards.rpc_method
def databases():
    return conn.databases()


@serverboards.rpc_method
def databases_select(**kwargs):
    service_id = (
        kwargs.get("service") or
        kwargs.get("service_id") or
        kwargs.get("server")
    )
    assert service_id
    open_(service_id)
    databases = conn.databases()

    return [
        {"name": d, "value": d}
        for d in databases
    ]


@serverboards.rpc_method
def tables():
    return conn.tables()


@serverboards.rpc_method
def table_select(server, database):
    open_(server, database)
    tables = conn.tables()
    return [
        {"name": d, "value": d}
        for d in tables
    ]


@serverboards.rpc_method
def execute(query, data=None):
    return conn.execute(query, data)


def is_truish(s):
    if len(s) == 0:
        return False
    while type(s) == list and len(s) >= 1:
        s = s[0]
    # serverboards.debug("Truish? %s"%(s))
    if s == 0:
        return False
    if s == []:
        return False
    if s is False:
        return False
    return True


@serverboards.cache_ttl(600)
def get_service_config(service_id):
    service = serverboards.service.get(service_id)
    return service["config"]


@serverboards.rpc_method
def watch_start(id=None, period=None, service_id=None,
                database=None, query=None, **kwargs):
    period_s = time_description_to_seconds(period or "5m")
    # print(id, period, service_id, database, query, kwargs)
    open_(service_id, database=database)

    class Check:

        def check_ok(self):
            try:
                p = execute(query)
            except Exception:
                serverboards.error("Error on SQL query: %s" % query)
                p = False
            serverboards.debug("Checking query: %s: %s" % (query, p))
            serverboards.rpc.event("trigger", {"id": id, "value": p["data"]})
            return True
    check = Check()
    check.check_ok()
    timer_id = serverboards.rpc.add_timer(period_s, check.check_ok, rearm=True)
    serverboards.info("Start SQL query watch %s" % timer_id)
    return timer_id


@serverboards.rpc_method
def watch_stop(id):
    serverboards.info("Stop SQL query watch %s" % (id))
    serverboards.rpc.remove_timer(id)
    return "ok"


@serverboards.rpc_method
def insert_row(server, database, table, data):
    # print("Insert to %s/%s/%s" % (server, database, table))
    data = yaml.load(data)
    # print("Data: %s" % data)
    open_(server, database)
    assert conn
    # field names as is, values as "%s" to fill later.
    insert = "INSERT INTO %s (%s) VALUES (%s)" % \
        (table, ','.join(data.keys()), ','.join('%s' for x in data.values()))
    # print("insert\n %s \n %s" % (insert, list(data.values())))
    conn.execute(insert, list(data.values()))


@serverboards.rpc_method
def schema(config, table=None):
    config = config.get("config")
    open_(config.get("service_id"), database=config.get("database"))
    if not table:
        return conn.tables()
    else:
        return {
            "columns": conn.columns(table)
        }


@serverboards.rpc_method
def extractor(config, table, quals, orig_columns):
    # print("extractor config", config)
    config = config.get("config")
    open_(config.get("service_id"), database=config.get("database"))

    columns = orig_columns
    if not orig_columns:
        columns = ["COUNT(*)"]

    if quals:
        where = ["%s %s %%s" % (q[0], q[1]) for q in quals]
        values = [q[2] for q in quals]
        sql = ("SELECT %s FROM %s WHERE %s" %
               (','.join(columns), table, ' AND '.join(where))
               )
        # print(sql)
        data = execute(sql, values)
        rows = data["data"]
    else:
        sql = "SELECT %s FROM %s" % (','.join(columns), table)
        # printc(sql)
        data = execute(sql)
        rows = data["data"]

    if not orig_columns:
        rows = [[] for x in range(rows[0][0])]

    return {
        "columns": orig_columns,
        "rows": rows
    }


def test():
    import smock
    smocked = smock.SMock("mock.yaml")
    serverboards.service.get = smocked.mock_method("service.get")
    printc("mocked")
    open_("XXX", database="serverboards")
    printc('databases', databases())
    printc('tables', tables())
    printc(execute("SELECT count(*) FROM auth_user;"))

    printc("\nSchema", color="green")
    config = {"config": {"service_id": "XXX", "database": "sbds"}}
    printc('schema', schema(config))
    printc('auth_user', schema(config, 'auth_user'))

    printc("\nExtractor", color="green")
    data = extractor(config, 'auth_user', [], ['id', 'name', 'is_active'])
    printc('extractor all', data)
    assert len(data["rows"]) > 1

    printc("\n")
    data = extractor(config, 'auth_user',
                     [['id', '=', 1]], ['id', 'name', 'is_active'])
    printc('extractor quals', data)
    assert len(data["rows"]) == 1


    printc("\n")
    data = extractor(config, 'auth_user',
                     [['id', '>=', 1]], [])
    printc('no columns', data)
    assert data["rows"] == [[], []]

    close()


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test()
    else:
        # serverboards.rpc.call("debug", True)
        serverboards.loop()
