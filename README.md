# System Monitor Web App 🖥️

A cross-platform real-time system monitoring dashboard that displays your system's performance metrics through a beautiful web interface. Works on both Windows and Linux.

## Features ✨

- **Real-time Monitoring**: Updates every second via WebSocket
- **Cross-Platform**: Optimized for both Windows and Linux with platform-specific server files
- **CPU Metrics**: 
  - Overall CPU usage
  - Per-core CPU usage with visual indicators
  - CPU temperature (Linux only)
- **Memory & Swap**: 
  - Usage percentages and graphs
  - Available/Used memory display
  - Historical charts
- **Network Activity**: 
  - Per-interface statistics
  - Upload/Download speeds
  - Real-time bandwidth graphs
- **Disk I/O**: 
  - Read/Write speeds
  - I/O operations per second
- **Beautiful UI**: 
  - Modern, responsive design
  - Color-coded metrics
  - Interactive charts using Chart.js
  - Collapsible sections

## Prerequisites 📋

### Windows:
- Node.js and npm installed
- Port 3000 available

### Linux:
- Node.js and npm installed
- Port 3000 available
- Optional: systemd for running as a service

## Quick Start 🚀

### Windows:

```cmd
REM Start the service
start_service.bat

REM Stop the service
stop_service.bat
```

### Linux:

```bash
# Start the service
./start_service.sh

# Stop the service
./stop_service.sh
```

### Linux (systemd Service - runs on boot)

For Linux systems that use systemd, you can install this as a system service:

```bash
# 1. Install system dependencies (requires sudo)
sudo ./install_deps.sh

# 2. Install as systemd service
./install_service.sh

# 3. Manage the service
systemctl status webmonitor  # Check status
journalctl -u webmonitor -f  # View logs

# 4. Uninstall the service (optional)
./uninstall_service.sh
```

### Development Mode

For local development with auto-reload:

**Windows:**
```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev:win
```

**Linux:**
```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev:linux
```

## Accessing the Dashboard 🌐

After starting the service, access the dashboard at:
- **Local**: http://localhost:3000
- **Remote**: http://YOUR_SERVER_IP:3000

## Project Structure 📁

```
webmonitor/
├── server_win.js          # Windows-specific server
├── server_linux.js        # Linux-specific server
├── package.json           # Node.js dependencies
├── public/                # Frontend files
│   ├── index.html         # Main HTML page
│   ├── app.js             # Frontend JavaScript
│   └── style.css          # Styles
├── start_service.bat      # Windows start script
├── stop_service.bat       # Windows stop script
├── start_service.sh       # Linux start script
├── stop_service.sh        # Linux stop script
├── install_service.sh     # Linux systemd service installer
├── uninstall_service.sh   # Remove systemd service (Linux)
├── install_deps.sh        # Install system dependencies (Linux)
└── webmonitor.service     # systemd service template (Linux)
```

## Backup 💾

**Linux:**
```bash
./backup.sh
```

**Windows:**
Manually zip the project folder or use your preferred backup tool.

Backups are stored in the `_BACKUP/` directory with timestamps.

## Troubleshooting 🔧

### Windows Issues:
- Port 3000 in use: Close other applications or modify PORT in server_win.js
- Node.js not found: Install from https://nodejs.org/
- Dependencies missing: Run `npm install`

### Linux Issues:
- Port 3000 in use: Run `sudo lsof -ti:3000 | xargs kill -9`
- Permission denied: Run scripts with `chmod +x start.sh stop.sh` first

### systemd Service Issues:
- Check service status: `systemctl status webmonitor`
- View logs: `journalctl -u webmonitor -f`
- Permissions: Ensure the service file has correct user and paths

### General Issues:
- Port 3000 in use: Change PORT environment variable or modify server file
- Missing dependencies: Run `npm install`
- Can't access remotely: Check firewall settings and use http://YOUR_IP:3000

## Technology Stack 💻

- **Backend**: Node.js, Express, WebSocket
- **Frontend**: Vanilla JavaScript, Chart.js
- **System Info**: systeminformation npm package (cross-platform)
- **Deployment**: Native on Windows/Linux, optional systemd service

## License 📄

MIT License
   
   Or for production mode:
   ```bash
   npm start
   ```

3. **Access at:**
   - http://localhost:3000

## Configuration ⚙️

### Change Port

Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Change 8080 to your desired port
```

Or set environment variable:
```yaml
environment:
  - PORT=8080
```

### Update Interval

The default update interval is 1 second. To change it, edit `server_win.js` or `server_linux.js`:
```javascript
const interval = setInterval(async () => {
  // ... metrics collection
}, 1000);  // Change 1000 to desired milliseconds
```

### Chart History

By default, charts show the last 60 data points. To change, edit `public/app.js`:
```javascript
const MAX_DATA_POINTS = 120;  // Show last 2 minutes at 1s interval
```

## Architecture 🏗️

```
webmonitor/
├── server_win.js         # Windows Node.js/Express backend
├── server_linux.js       # Linux Node.js/Express backend
├── package.json          # Dependencies and scripts
├── Dockerfile            # Container configuration
├── docker-compose.yml    # Docker Compose setup
├── public/
│   ├── index.html        # Dashboard HTML structure
│   ├── style.css         # Styling and animations
│   └── app.js            # Frontend logic and charts
└── README.md             # This file
```

### Technology Stack

- **Backend**: Node.js, Express, WebSocket (ws)
- **System Metrics**: systeminformation library
- **Frontend**: Vanilla JavaScript, Chart.js
- **Containerization**: Docker

## Security Considerations 🔒

- The container runs with `--pid host` and `--network host` to access system metrics
- Read-only mounts are used for system directories
- No privileged mode required
- Consider using a reverse proxy (nginx, traefik) with HTTPS for remote access
- Add authentication if exposing to the internet

### Adding Basic Authentication (Optional)

Install express-basic-auth:
```bash
npm install express-basic-auth
```

Add to the appropriate server file (`server_win.js` or `server_linux.js`):
```javascript
const basicAuth = require('express-basic-auth');

app.use(basicAuth({
  users: { 'admin': 'your-password' },
  challenge: true
}));
```

## Troubleshooting 🔧

### Container doesn't start
- Check logs: `docker-compose logs webmonitor`
- Ensure port 3000 is not in use: `netstat -tuln | grep 3000`

### No data showing
- Verify the container has proper access to host system:
  ```bash
  docker exec system-monitor ls /host/proc
  ```

### High CPU usage
- Increase update interval in server_win.js or server_linux.js
- Reduce MAX_DATA_POINTS in app.js

### Can't access remotely
- Check firewall: `sudo ufw allow 3000`
- Verify the container is using host network: `docker inspect system-monitor`

## Performance Impact 📊

- CPU usage: ~1-2% on average
- Memory usage: ~50-100 MB
- Network: Minimal (~1-2 KB/s per client)

## Stopping and Removing 🛑

```bash
# Stop the container
docker-compose down

# Remove the container and image
docker-compose down --rmi all

# Remove volumes (if any)
docker-compose down -v
```

## Updating 🔄

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## License 📄

MIT License - Feel free to use and modify!

## Contributing 🤝

Contributions are welcome! Feel free to submit issues and pull requests.

## Support ❓

For issues and questions, please open an issue on the repository.

---

**Enjoy monitoring your system!** 🎉
