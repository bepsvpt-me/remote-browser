#!/usr/bin/env bash
set -e

xvfb-run -a --server-args="-screen 0 1x1x24 -ac -nolisten tcp +extension RANDR" node index.js
