# Changelog

## Code Cleanup - 2026-06-11

### Removed Dead Code
- **server.js**: Removed unused `processes` data collection from WebSocket metrics
  - The processes data was collected but never displayed in the frontend
  - Reduced unnecessary system calls and improved performance

### Fixed Hardcoded Paths
- **install_service.sh**: Updated to dynamically detect script directory and current user
  - Removed hardcoded path `/home/kosch/AI/WebMonitor/`
  - Now auto-configures paths based on installation location
  - Automatically sets the correct user in the service file

- **webmonitor.service**: Updated with placeholder values
  - Changed hardcoded user `kosch` to `your-username`
  - Changed hardcoded path to `/path/to/webmonitor`
  - Added comments indicating values are auto-configured by installer

### Fixed Confusing Scripts
- **start.sh**: Corrected logic to match intended Docker Compose deployment
  - Previously checked for Docker but ran `npm start` natively (inconsistent)
  - Now properly builds and starts Docker Compose containers
  - Added better user feedback with status messages
  - Matches the behavior of start.bat for consistency

### Improved Code Readability

#### server.js
- Reorganized imports for better clarity
- Added comprehensive comments explaining:
  - Middleware setup
  - WebSocket connection handling
  - Metrics collection process
  - Data payload structure
- Improved code structure with clear separation of concerns

#### public/app.js
- Added detailed section headers for:
  - Global variables
  - Chart configuration
  - Data formatting helpers
  - UI functions
  - WebSocket connection
  - Chart initialization
  - Metrics update functions
- Enhanced function documentation with clear purpose statements
- Added comments explaining the ring buffer implementation
- Documented the 60-second data window behavior

#### public/style.css
- Organized into logical sections with clear headers:
  - Global Styles
  - Monitor Section Structure
  - Chart Styling
  - CPU Legend
  - Statistics Display
- Added descriptive comments for each component

#### public/index.html
- Added HTML comments for each section (CPU, Memory, Network, Disk)
- Added comment for Chart.js CDN import
- Improved overall structure and readability

### Updated Documentation
- **README.md**: Complete rewrite with better organization
  - Clearly documented three deployment options (Docker, systemd, Development)
  - Added comprehensive project structure section
  - Improved troubleshooting guide
  - Added backup instructions
  - Better organized prerequisites
  - More detailed usage examples for each deployment method

- **.gitignore**: Updated to follow best practices
  - Removed incorrect entries (README.md, docker-compose.yml should not be ignored)
  - Added proper sections for dependencies, logs, backups, IDE files, OS files
  - Added _BACKUP/ to ignore backups folder

### Summary of Benefits
1. **Performance**: Removed unnecessary process data collection
2. **Portability**: Service installation now works on any Linux system without hardcoded paths
3. **Consistency**: Fixed start.sh to match its intended Docker deployment purpose
4. **Maintainability**: Added extensive comments and documentation
5. **Developer Experience**: Clear code organization makes future modifications easier
6. **User Experience**: Updated README provides clear guidance for all deployment methods
