# denops-mysql.vim
Vim plugin for mysql

![](https://user-images.githubusercontent.com/7888591/137347252-c9548937-75fd-44f5-a054-ece27957a0bb.gif)

## Features
- execute sql

## Usage
```vim
" execute current line as sql
:MySQLQuery

" execute selected lines as sql
:'<,'>MySQLQuery

" connect to database
:MySQLConnect test
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
