#!/usr/bin/env node

var req = require('request')
var cheerio = require('cheerio')
var username = process.argv[2]
var commitsNeeded = 0
var commitsHas= 0
var followersNeeded = 0
var followersHas = 0
var headers = {'user-agent': 'https://github.com/muan/gntu'}

if(!username) {
  handleErr('💥  give me a username to check.')
}

start()

function fetchUser() {
  process.stdout.write('finding out how many public commits @' + username + ' has... ')
  req('https://github.com/' + username, function (err, response, data) {
    if(err) handleErr(err)
    if(response.statusCode === 404) {
      handleErr('there is no user named @' + username + '!')
    } else if (response.statusCode === 200) {
      $ = cheerio.load(data)
      commitsHas = $('.contrib-number').text().split(' ')[0].replace(/,/, '')
      process.stdout.write(commitsHas + '!\n')

      req({url: 'https://api.github.com/users/' + username, headers: headers }, function (err, response, data) {
        if(err || (response && response.statusCode !== 200)) handleErr(err, data)
        data = JSON.parse(data)
        followersHas = data.followers
        grandReveal()
      })
    } else {
      handleErr(null, data)
    }
  })
}

function start() {
  process.stdout.write('finding out the lowest number of commits @' + username + ' will need... ')
  req({ url: 'https://api.github.com/gists/2657075', headers: headers }, function (err, response, data) {
    if(err || (response && response.statusCode !== 200)) handleErr(err, data)
    if(response.statusCode === 200) {
      data = JSON.parse(data)
      var content = data.files['active.md'].content
      followersNeeded = content.match(/user.followers > ([0-9]+)\)/)[1]
      $ = cheerio.load(content)

      commitsNeeded = $('tr').last().find('td:nth-child(3)').text()
      process.stdout.write(commitsNeeded + '!\n')
      
      if($('table [href="https://github.com/' + username + '"]').length) {
        process.stdout.write('looks like @' + username + ' is already on the list!\n')
        process.exit(0)
      } else {
        fetchUser()
      }
    }
  })
}

function grandReveal() {
  var diff = commitsNeeded - commitsHas
  var fdiff = followersNeeded - followersHas
  if(diff > 0) {
    if(fdiff > 0) {
      console.log('@' + username + ' needs ' + diff + ' more commits and ' + fdiff + ' more followers to be on *the* list.')
    } else {
      console.log('@' + username + ' needs ' + diff + ' more commits to be on *the* list.')
    }
  } else if(fdiff > 0) {
    console.log('@' + username + ' needs ' + fdiff + ' more followers to be on *the* list.')
  } else {
    console.log('@' + username + ' should be on that list already!')
  }
  process.exit(0)
}

function handleErr(err, data) {
  err = err || 'Something went wrong.'
  console.log(err)
  if(data) console.log(data)
  process.exit(1)
}
