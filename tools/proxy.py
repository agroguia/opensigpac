from fabric.api import *
import sys 
from os import environ
import os
import time


NOW = int(time.time())

sigpac_hosts = [
                 "opensigpac.cartodb.net"
               ]

env.disable_known_hosts = True
env.user = 'root'

def upload_conf():
  put('nginx/conf', '/etc/nginx/sites-available/opensigpac') 
  run("/etc/init.d/nginx restart")

def upload_usos():
  put('nginx/usos_sigpac.json', '/var/www/opensigpac/usos_sigpac.json') 

def setup_nginx_server():
  run("apt-get install nginx -y")
  upload_conf()
  run("ln -s /etc/nginx/sites-available/opensigpac /etc/nginx/sites-enabled/opensigpac")
  run("mkdir -p /var/www/opensigpac")

def deploy_nginx_conf():
  upload_conf()
