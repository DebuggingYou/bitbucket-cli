const axios = require('axios')
const ora = require('ora')
const prettyjson = require('prettyjson')

module.exports = ({ program }) => {
  const reviewers = []
  const addReviewer = (value) => {
    reviewers.push(value)
  }

  program
    .description('Create a Bitbucket PR')
    .arguments('<repo-slug> <title>')
    .option('-s, --source <source>', 'Source Branch', 'develop')
    .option('-t, --target <target>', 'Target Branch', 'master')
    .option('-r, --reviewer <reviewer>', 'Add one or more reviewers by username (only Username works)', addReviewer)
    .option('-d, --description <description>', 'Describe the PR, supports Markdown')
    .option('-u, --username <username>', 'Username to connect to bitbucket')
    .option('-p, --password <password>', 'Password to connect to bitbucket')
    .option('--keep-branch', 'Should BB keep the branch open after merge?')
    .action((repoSlug, title, cmd) => {
      const spinner = ora('Creating Pull Request').start()

      const message = {
        title: title,
        close_source_branch: !cmd.keepBranch,
        source: {
          branch: {
            name: cmd.source
          }
        },
        target: {
          branch: {
            name: cmd.target
          }
        }
      }

      // default = function due to commander
      if (typeof cmd.description === 'string') {
        message.description = cmd.description
      }

      if (reviewers.length) {
        message.reviewers = reviewers.map((r) => {
          return {
            username: r
          }
        })
      }

      console.log(message.reviewers)

      const url = `https://api.bitbucket.org/2.0/repositories/${repoSlug}/pullrequests`

      axios.post(url, message, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        withCredentials: true,
        auth: {
          username: cmd.username,
          password: cmd.password
        },
        responseType: 'json'
      }).then((r) => {
        spinner.succeed('Successfully created PR ' + r.data.links.html.href)
      }).catch((e) => {
        spinner.fail('Failed creating PR with Status ' + e.response.status)
        console.log(prettyjson.render(e.response.data, { keysColor: 'red' }))
      })

    })
}

