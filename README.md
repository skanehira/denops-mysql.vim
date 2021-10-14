# denops-mysql.vim
Vim plugin for mysql

![](https://i.gyazo.com/921fff2f76f4ee59772c3d50fe7cc3fe.gif)

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
