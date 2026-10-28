import pymysql
import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"
pymysql.install_as_MySQLdb()