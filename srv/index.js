const express = require(`express`);
const path = require(`path`);
const morgan = require(`morgan`);
const fs = require(`fs`);
const session = require(`express-session`);
const bodyParser = require(`body-parser`);
const multer = require(`multer`);
const mongoose = require(`mongoose`);
const MongoDBSession = require(`connect-mongodb-session`)(session);
const discordBot = require(`${__dirname}/discordBot/bot.js`);
const fetch = require(`node-fetch`);
require(`dotenv`).config({ path: `../.env` });


// TODO: add db for storage object here
const upload = multer();
// import socketIO from "socket.io";

// constants
const MONGO = {
  session: `session`,
  users: `Users`,
};


const {
  COOKIE_SECRET = `secret`,
  MONGODB_URI,
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  HOST_BASE,
} = process.env;

// mongoose setup
if (!MONGODB_URI) {
  console.error(`mongodb uri is not provided`);
  process.exit(1);
}

// cookies
const store = new MongoDBSession({
  uri: `${MONGODB_URI}/${MONGO.session}`,
  collection: `cookies`,
});

const cookieSession = mongoose.createConnection(`${MONGODB_URI}/${MONGO.session}`, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

const userDb = mongoose.createConnection(`${MONGODB_URI}/${MONGO.users}`, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

const {
  UserSchema, 
  CookieSchema,
  MemeSchema,
} = require(`${__dirname}/db`);

const CookieModal = cookieSession.model(MONGO.session, CookieSchema);
const UserModal = userDb.model(MONGO.users, UserSchema);

// https redirect is done on nginx
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, `access.log`),
  { flags: `a` },
);
module.exports = (app) => {
  // form parsers
  app.use(bodyParser.urlencoded({extended: true}));

  // cookies 🍪
  app.use(session({
    secret: COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
  }));

  // logs
  app.use(morgan(`combined`, { stream: accessLogStream }));

  // api
  app.use(express.json());
  app.get(`/api`, (req, res) => {
    res.json({msg: `works`});
  });

  app.post(`/meme`, upload.single(`meme`), async (req, res) => {
    // add session id validation
    // post it to a discord database channel and retrieve url
    const url = await discordBot.upload();
  });

  // discord login
  app.get(`/login`, async (req, res, next) => {
    // add code that checks if the session already has a token
    let q = await UserModal.findOne({ sessionId: req.session.id});
    if (q) {
      // user exists
      if (q.discordId) {
        res.redirect(`/`);
        return;
      }
    }
    // TODO: split this into a separate file
    const scopes = [`identify`];
    if (!req.query.code) {
      const uri = `${HOST_BASE}/login`;

      res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(uri)}&response_type=code&scope=${encodeURIComponent(scopes.join(` `))}`);
      return;
    }
    
    // the user has a code query
    console.log(`processing request ${req.query.code} to discord`);
    const payload = {
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: `authorization_code`,
      code: req.query.code,

      redirect_uri: `${HOST_BASE}/login`,
    };
    const headers = {
      "Content-Type": `application/x-www-form-urlencoded`,
    };
    const response = await fetch(`https://discord.com/api/oauth2/token`, {
      method: `POST`,
      body: new URLSearchParams(payload),
      headers,
    }).then(v => v.json());
    console.log(response);
    const rscopes = response.scope.split(` `);
    if (response.error || !response.access_token) {
      res.send(`invalid token or internal server error :(`);
      return;
    } else if (!scopes.every(v => rscopes.includes(v))) {
      res.send(`scope mismatch. did you edit the url?`);
      return;
    }
    const accessToken = response.access_token;
    fetch(`https://discord.com/api/users/@me`, {
      headers: {
        authorization: `${response.token_type} ${response.access_token}`,
      },
    }).then( async userInfo => {
      userInfo = await userInfo.json();
      // if user info already exists, welcome back
      console.log(userInfo);
      const q = await UserModal.findOne({
        discordId: userInfo.id,
      });
      if (q === null) {
        // new user
        const newUser = new UserModal({
          discordId: userInfo.id,
          discordUserObj: userInfo,
          accessToken,
          sessionId: req.session.id,
        });
        newUser.save();
      } else {
        // returning user
        console.log(`this user exists`);
      }
    });
    // redirect to home
    req.session.discord = true;
    res.redirect(`/`);
  }); 

  // vue view
  app.use(require(`connect-history-api-fallback`)());

  // // vue output
  // app.set(`views`, `dist`);
  // app.set(`view engine`, `html`);
  
  // TODO: i was originally going to use views instead of static but for some reason i cant get views to work and the below works just fine idk maybe ill fix it when im better at express or smth
  app.use(express.static(`dist`));

  
  // app.post('/bar', (req, res) => {
  //   res.json(req.body);
  // });
  //
  // optional support for socket.io
  //
  // let io = socketIO(http);
  // io.on("connection", client => {
  //   client.on("message", function(data) {
  //     // do something
  //   });
  //   client.emit("message", "Welcome");
  // });
};
