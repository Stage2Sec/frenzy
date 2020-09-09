#!/bin/bash

copy(){
    find ./ -name $1 -not -path "*node_modules*" -not -path "*dist*" | while read path; do
        dir=`dirname $path`
        mkdir -p "dist/$dir"
        cp $path "dist/$path"
    done
}

copy tsconfig.json
copy package.json