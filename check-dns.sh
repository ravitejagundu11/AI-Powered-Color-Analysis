#!/bin/bash

echo "🔍 Checking DNS for color-analysis.me..."
echo ""
nslookup color-analysis.me
echo ""
echo "Expected IP: 35.226.154.58"
echo ""
echo "If you see ONLY 35.226.154.58, DNS is configured correctly."
echo "If you see other IPs (like 185.199.x.x), wait a few minutes and run this again."
