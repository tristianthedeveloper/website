# Branch is pretty stable. Just do npm install and everything should work pretty fine. **Make sure you have vue cli installed**

# quick start and help with front end

if you dont have key and cert, go to `vue.config.js` and set https to false.  
do `npm run serve` and vue cli will launch a front end hot reload server. its pretty much out of the box.  
if you want to do some fancy stuff, read below

# node

uses `v15.5.0`. all other module dependencies only work with `v15`. if you project doesn't work just delete `node_modules` and abuse npm

# express

this project uses express as backend. if you want to run this server WITH the backend, `do npm run express`  
make sure to run `npm run build` so vue can build files to `./dist/`

# website

[stem.help](https://stem.help)

# database

Good news, we actually use a mongodb. 

# configuring
`/srv`
```env
# these are optional
HTTP_PORT=80
HTTPS_PORT=443
COOKIE_SECRET=secret key. not required for dev server
DISCORD_CLIENT_SECRET=the discord application token
DISCORD_CLIENT_ID=the id
MONGODB_URI=mongodb uri. required for dev
```

`srv/discordBot`
```env
DISCORD_BOT_TOKEN=the discord BOT token
```

# vue setup

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Run your unit tests

```
npm run test:unit
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
