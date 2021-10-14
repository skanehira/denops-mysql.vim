" cached resource names
let s:databaseList = []

function! mysql#databaseNames(argLead, l, p) abort
  if a:argLead == ""
    let s:databaseList = denops#request("mysql", "databaseList", [])
  endif
  return filter(s:databaseList, { _, v -> v =~# printf(".*%s.*", a:argLead)})
endfunction
