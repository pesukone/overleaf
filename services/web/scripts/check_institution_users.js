const { waitForDb } = require('../app/src/infrastructure/mongodb')
const InstitutionsManager = require('../app/src/Features/Institutions/InstitutionsManager')

const institutionId = parseInt(process.argv[2])
if (isNaN(institutionId)) throw new Error('No institution id')
console.log('Checking users of institution', institutionId)
const emitNonProUserIds = process.argv.includes('--emit-non-pro-user-ids')

waitForDb()
  .then(main)
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

async function main() {
  const usersSummary = await InstitutionsManager.promises.checkInstitutionUsers(
    institutionId,
    emitNonProUserIds
  )
  console.log(usersSummary)
  process.exit()
}
