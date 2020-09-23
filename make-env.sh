#!/bin/bash

find ./ -name ".env" -not -path "*node_modules*" -not -path "*dist*" | while read path; do
    cat $path
    echo ""
done > frenzy.env