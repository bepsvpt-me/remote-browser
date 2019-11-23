# Remote Browser

Using WebRTC to connect to puppeteer which running on remote server.

## Installation

1. clone this repo `git clone https://github.com/bepsvpt/remote-browser.git`
2. run `chrome-dependencies-installer.sh` as root to install chrome dependencies(only test in Ubuntu 19.10)
3. run `yarn install` to install node dependencies
4. copy `.env.example` to `.env` and setup environment variables

## Start Server

Run following command to start server:

```shell
xvfb-run -a --server-args="-screen 0 3840x2160x24 -ac -nolisten tcp +extension RANDR" yarn start
```

## License

This project is licensed under [GNU Affero General Public License v3.0 only](LICENSE).
