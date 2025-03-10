import getMeta from '../../../utils/meta'
import HumanReadableLogs from '../../../ide/human-readable-logs/HumanReadableLogs'
import BibLogParser from '../../../ide/log-parser/bib-log-parser'
import { buildFileList } from './file-list'

const searchParams = new URLSearchParams(window.location.search)

export const handleOutputFiles = async (projectId, data) => {
  const result = {}

  const outputFiles = new Map()

  for (const outputFile of data.outputFiles) {
    outputFiles.set(outputFile.path, outputFile)
  }

  const outputFile = outputFiles.get('output.pdf')

  if (outputFile) {
    // build the URL for viewing the PDF in the preview UI
    const params = new URLSearchParams({
      compileGroup: data.compileGroup,
    })

    if (data.clsiServerId) {
      params.set('clsiserverid', data.clsiServerId)
    }

    if (searchParams.get('verify_chunks') === 'true') {
      // Instruct the serviceWorker to verify composed ranges.
      params.set('verify_chunks', 'true')
    }

    if (getMeta('ol-enablePdfCaching')) {
      // Tag traffic that uses the pdf caching logic.
      params.set('enable_pdf_caching', 'true')
    }

    result.pdfUrl = `${data.pdfDownloadDomain}${outputFile.url}?${params}`

    // build the URL for downloading the PDF
    params.set('popupDownload', 'true') // save PDF download as file

    result.pdfDownloadUrl = `/download/project/${projectId}/build/${outputFile.build}/output/output.pdf?${params}`
  }

  const params = new URLSearchParams({
    compileGroup: data.compileGroup,
  })

  if (data.clsiServerId) {
    params.set('clsiserverid', data.clsiServerId)
  }

  result.logEntries = {
    all: [],
    errors: [],
    warnings: [],
    typesetting: [],
  }

  function accumulateResults(newEntries, type) {
    for (const key in result.logEntries) {
      if (newEntries[key]) {
        for (const entry of newEntries[key]) {
          if (type) {
            entry.type = newEntries.type
          }
          if (entry.file) {
            entry.file = normalizeFilePath(entry.file)
          }
          entry.key = `${entry.file}:${entry.line}:${entry.column}:${entry.message}`
        }
        result.logEntries[key].push(...newEntries[key])
        result.logEntries.all.push(...newEntries[key])
      }
    }
  }

  const logFile = outputFiles.get('output.log')

  if (logFile) {
    const response = await fetch(`${logFile.url}?${params}`)

    const log = await response.text()

    result.log = log

    const { errors, warnings, typesetting } = HumanReadableLogs.parse(log, {
      ignoreDuplicates: true,
    })

    accumulateResults({ errors, warnings, typesetting })
  }

  const blgFile = outputFiles.get('output.blg')

  if (blgFile) {
    const response = await fetch(`${blgFile.url}?${params}`)

    const log = await response.text()

    const { errors, warnings } = new BibLogParser(log, {}).parse()

    accumulateResults({ errors, warnings }, 'BibTeX:')
  }

  result.fileList = buildFileList(outputFiles, data.clsiServerId)

  return result
}

export function buildLogEntryAnnotations(entries, fileTreeManager) {
  const rootDocDirname = fileTreeManager.getRootDocDirname()

  const logEntryAnnotations = {}

  for (const entry of entries) {
    if (entry.file) {
      entry.file = normalizeFilePath(entry.file, rootDocDirname)

      const entity = fileTreeManager.findEntityByPath(entry.file)

      if (entity) {
        if (!(entity.id in logEntryAnnotations)) {
          logEntryAnnotations[entity.id] = []
        }

        logEntryAnnotations[entity.id].push({
          row: entry.line - 1,
          type: entry.level === 'error' ? 'error' : 'warning',
          text: entry.message,
          source: 'compile',
        })
      }
    }
  }

  return logEntryAnnotations
}

function normalizeFilePath(path, rootDocDirname) {
  path = path.replace(
    /^.*\/compiles\/[0-9a-f]{24}(-[0-9a-f]{24})?\/(\.\/)?/,
    ''
  )

  path = path.replace(/^\/compile\//, '')

  if (rootDocDirname) {
    path = path.replace(/^\.\//, rootDocDirname + '/')
  }

  return path
}
