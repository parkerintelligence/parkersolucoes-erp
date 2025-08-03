#!/bin/bash

# Fix all React imports to use the standard pattern
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/import \* as React from [\'"'"'"']react[\'"'"'"']/import React from [\'"'"'"']react[\'"'"'"']/g'

echo "Fixed React imports in all TypeScript files"