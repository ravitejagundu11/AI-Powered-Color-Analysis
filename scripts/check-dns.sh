#!/bin/bash

echo "🔍 Checking DNS for color-analysis.me..."
echo ""
nslookup color-analysis.me
echo ""
echo "Expected IP: 35.222.13.151 (Static IP)"
echo ""
echo "If you see ONLY 35.222.13.151, DNS is configured correctly."
echo "If you see other IPs (like 185.199.x.x), wait a few minutes and run this again."
