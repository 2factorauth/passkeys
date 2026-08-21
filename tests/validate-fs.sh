#!/bin/bash

status=0
files=("$@")

# $1 = directory
# $2, $3, ... = permitted file extensions
function checkExt()
{
  dir="$1"
  shift
  regex="\\.\($(echo $* | sed 's/ /\\|/g')\)$"
  if [ ${#files[@]} -eq 0 ]; then
    if find "$dir" -type f 2>/dev/null | grep -q -v "$regex"; then
      echo "Directory '$dir' may only have files with the following extensions: $*"
      status=1
    fi
  else
    for f in "${files[@]}"; do
      [[ "$f" == "$dir"/* ]] || continue
      [ -f "$f" ] || continue
      if ! echo "$f" | grep -q "$regex"; then
        echo "File '$f' has a disallowed extension; '$dir' may only have files with the following extensions: $*"
        status=1
      fi
    done
  fi
}

# $1 = directory
# $2, $3, ... = permitted file permissions
function checkPerm()
{
  dir="$1"
  shift
  unset pattern
  for p; do
    pattern+="${pattern+ -a }! -perm $p"
  done
  if [ ${#files[@]} -eq 0 ]; then
    if find "$dir" -type f $pattern -print -quit 2>/dev/null | grep -q .; then
      echo "Directory '$dir' may only have files with the following permissions: $*"
      status=1
    fi
  else
    for f in "${files[@]}"; do
      [[ "$f" == "$dir"/* ]] || continue
      [ -f "$f" ] || continue
      if find "$f" -maxdepth 0 -type f $pattern -print -quit | grep -q .; then
        echo "File '$f' has a disallowed permission; '$dir' may only have files with the following permissions: $*"
        status=1
      fi
    done
  fi
}

[ ${#files[@]} -eq 0 ] && [ -e api ] && checkExt api json sig
checkExt icons svg png
checkExt entries json
checkExt scripts js sh
checkExt tests js sh json
checkPerm icons 664 644
checkPerm tests 775 755 664 644
checkPerm entries 664 644
checkPerm scripts 775 755
checkPerm .github 664 644
exit $status
