# Name-gen

## Setup

- `npm install` 

## Generate names

- `cat txt/example-name-input.txt | ./gen-names.sh`
- `echo 'Super Nintendo' | ./gen-names.sh`

Modify source to add variations, hardcoded chunks, change rules, etc.

## Check domain names

- `cat txt/example-domain-input.txt | ./check-domains.sh`
- `echo 'sega getapp.io example.com' | API_KEY=<API_KEY> ./check-domains.sh`

Uses [https://www.ip2whois.com](), set `API_KEY` from your account.

Modify source to add variations and top level domains.