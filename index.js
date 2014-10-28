#!/usr/bin/env node

var req = require('request')
var cheerio = require('cheerio')
var username = process.argv[2]
var commitsNeeded = 0
var commitsHad = 0

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
      commitsHad = $('.contrib-number').text().split(' ')[0]
      process.stdout.write(' ' + commitsHad + '!\n')

      findLowest()
    }
  })
}

function findLowest() {
  process.stdout.write('finding out the lowest number of commits @' + username + ' will need...')
  req({ url: 'https://api.github.com/gists/2657075', headers: {'user-agent': 'muan'} }, function (err, response, data) {
    if(err) console.log(err)
    if(response.statusCode === 200) {
      data = JSON.parse(data)
      var content = data.files['active.md'].content
      var table = content.split('<table cellspacing="0">')[1].split('</table>')[0]
      $ = cheerio.load(table)

      commitsNeeded = $('tr').last().find('td:nth-child(3)').text()
      process.stdout.write(' ' + commitsNeeded + '!\n')
      
      grandReveal()
    }
  })
}

function grandReveal() {
  var diff = commitsNeeded - commitsHad
  if(diff > 0) {
    console.log('@' + username + ' needs ' + diff + ' more commits to be on the list.')
  } else {
    console.log('@' + username + ' should be on that list already!')
  }
  process.exit(0)
}
