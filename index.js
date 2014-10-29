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
  console.log('💥  give me a username to check.')
  process.exit(1)
}

start()

function start() {
  process.stdout.write('finding out how many public commits @' + username + ' has...')
  req('https://github.com/' + username, function (err, response, data) {
    if(err) console.log(err)
    if(response.statusCode === 404) {
      console.log('\nthere is no user named @' + username + '!')
      process.exit(1)
    }
    if(response.statusCode === 200) {
      $ = cheerio.load(data)
      commitsHas = $('.contrib-number').text().split(' ')[0].replace(/,/, '')
      process.stdout.write(' ' + commitsHas + '!\n')

      req({url: 'https://api.github.com/users/' + username, headers: headers }, function (err, response, data) {
        if(err) console.log(err)
        if(response.statusCode === 200) {
          data = JSON.parse(data)
          followersHas = data.followers
          findLowest()
        }
      })
    }
  })
}

function findLowest() {
  process.stdout.write('finding out the lowest number of commits @' + username + ' will need...')
  req({ url: 'https://api.github.com/gists/2657075', headers: headers }, function (err, response, data) {
    if(err) console.log(err)
    if(response.statusCode === 200) {
      data = JSON.parse(data)
      var content = data.files['active.md'].content
      followersNeeded = content.match(/user.followers > ([0-9]+)\)/)[1]
      var table = content.split('<table cellspacing="0">')[1].split('</table>')[0]
      $ = cheerio.load(table)

      commitsNeeded = $('tr').last().find('td:nth-child(3)').text()
      process.stdout.write(' ' + commitsNeeded + '!\n')
      
      grandReveal()
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
  } else if(followersNeeded > followersHas) {
    console.log('@' + username + ' should be on that list BUT does not have meet the followers requirement :(')
  } else {
    console.log('@' + username + ' should be on that list already!')
  }
  process.exit(0)
}
