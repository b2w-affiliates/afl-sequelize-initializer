const Sequelize = require('sequelize')
const URL = require('url')
const fs = require("fs")
const { logger } = require('afiliados-logger')

const defaultPort = 3306
module.exports = conf => {

  const {
    primary: primarySqlUrl,
    secondary: secondarySqlUrl,
    config = {},
  } = conf
  

  let sequelize


  if (secondarySqlUrl) {
    // primary config
    const primaryUri = new URL.parse(primarySqlUrl)
    const database = primaryUri.pathname.replace(/\//, '')
    const protocol = primaryUri.protocol.replace(/:/, '')
    
    const [ username, password ] = primaryUri.auth.split(':')
    const { hostname: primaryHost, port } = primaryUri


    // secondary host
    const secondaryUri =  new URL.parse(secondarySqlUrl)
    const [ usernameRead, passwordRead ] = primaryUri.auth.split(":")
    const { hostname: secondaryHost, port: port2 } = primaryUri

    const clusterConf = {
      logging: config.logging,
      benchmark: config.benchmark,
      dialect: protocol,
      port: port || defaultPort,
      replication: {

        write: {
          host: { 
            host: primaryHost,
            username,
            password,
            port: port || defaultPort
          }
        },
        read: [
          {
            port: port2 || defaultPort,
            host: secondaryHost,
            username: usernameRead,
            password: passwordRead,
          },
        ],

      },
    }

    sequelize = new Sequelize(database, null, null, clusterConf)
  } else {
    sequelize = new Sequelize(primarySqlUrl, config)
  }

  return sequelize
}