# denops-mysql.vim
Vim plugin for mysql

## Features
- execute/query sql

## Usage
```vim
" execute/query
" current buffer will be used as sql query
:MySQLQuery
" connect to database
:MySQLConnect
```

## Config
`$XDG_HOME/denops_mysql/config.yaml`

```yaml
databases:
  - alias: gorilla
    username: gorilla
    password: gorilla
    dbname: gorilla
    host: gorilla
    port: 5555
  - alias: test
    username: test
    password: test
    dbname: test
    host: localhost
    port: 3306
```

## Author
skanehira
