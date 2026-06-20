#!/bin/bash
cd /home/ubuntu/Akaka/animation-nexus
node server/index.js > /tmp/nexus-server.log 2>&1 &
echo "Animation Nexus API started on port 3001"
