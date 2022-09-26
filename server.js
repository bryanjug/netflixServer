const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const axios = require('axios');
const dotenv = require('dotenv');
const { setInterval, clearInterval } = require('timers/promises');
const internal = require('stream');
dotenv.config();
const key = process.env.API_TOKEN;
const db = process.env.DATABASE;
const movieDB = process.env.MOVIE_DB;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const routes = require('./routes/routes.js')(app, fs);

var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = today.getFullYear();

today = mm + '/' + dd + '/' + yyyy;

let data = {
  "lastUpdate":`${today}`,
  "new": {
    "movies": {

    },
    "TVShows": {

    }
  },
  "popularMovies": {

  },
  "popularTVShows": {

  },
  "trendingMovies": {

  },
  "genres": {

  }
};

let newGenreData = {};

function GetDataAndUpdate () {
    axios.get(`${movieDB}movie/latest?api_key=${key}`)
    .then(function (response) {
      // handle success
      console.log("Successfully requested latest movie data.");
      data.new.movies = response.data;

      axios.get(`${movieDB}tv/latest?api_key=${key}`)
      .then(function (response) {
        // handle success
        console.log("Successfully requested latest TV Show data.");
        data.new.TVShows = response.data;

        axios.get(`${movieDB}movie/popular?api_key=${key}`)
        .then(function (response) {
          // handle success
          console.log("Successfully requested popular movie data.");
          data.popularMovies = response.data;

          axios.get(`${movieDB}tv/popular?api_key=${key}`)
          .then(function (response) {
            // handle success
            console.log("Successfully requested popular TV Show data.");
            data.popularTVShows = response.data;

            axios.get(`${movieDB}trending/movie/week?api_key=${key}`)
            .then(function (response) {
              // handle success
              console.log("Successfully requested trending movie data.");
              data.trendingMovies = response.data;

              axios.get(`${movieDB}genre/movie/list?api_key=${key}`)
              .then(function (response) {
                // handle success
                console.log("Successfully requested genre list data.");
                data.genres = response.data;
                
                GetGenreDataAndUpdate();
              })
              .catch(function (error) {
                // handle error
                console.log(error);
              })
            })
            .catch(function (error) {
              // handle error
              console.log(error);
            })
          })
          .catch(function (error) {
            // handle error
            console.log(error);
          })
        })
        .catch(function (error) {
          // handle error
          console.log(error);
        })
      })
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
}

async function GetGenreDataAndUpdate() {
  let length = data.genres.genres.length;
  let genres = data.genres.genres;

  for (i = 0; i < length; i++) {
    let oldObj = {id: genres[i].id, name: genres[i].name};
    
    await axios.get(`${movieDB}discover/movie?api_key=${key}&with_genres=${genres[i].id}`)
    .then(function (response) {
      // handle success
      console.log("Successfully requested genre data.");
      let result = {result: response.data}
      oldObj = {...oldObj, result}
      newGenreData = JSON.stringify(oldObj)
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })  
  }
  data.genres = newGenreData;

  UpdateDB();
  
  console.log("Completed function.")
}

async function UpdateDB() {
  await axios.put(`${db}users/1`, {data})
  .then(function (response) {
    console.log("DB Updated")
  })
}

async function SetTimer() {
  let interval = setInterval(GetDataAndUpdate, 10000);
  if (interval === 10) {
    clearInterval(interval)
  }
}

SetTimer();

const server = app.listen(3001, () => {
    console.log('listening on port %s...', server.address().port);
});