import {getInput, setFailed} from '@actions/core'
import {getIntInput, getBooleanInput} from './input'
import {syncToS3Bucket, syncSpecificFiles} from './aws/s3'
import {invalidateCloudfront} from './aws/cloudfront'

async function deploy(): Promise<void> {

  // Check if we got a list of specific files.
  const specificFiles = getInput('specific-files-only');
  if (specificFiles) {
    await syncSpecificFiles(
      getInput('public-source-path'),
      getInput('dest-s3-bucket', {required: true}),
      getInput('dest-s3-path'),
      specificFiles,
      ['*.html', 'page-data/*.json', 'sw.js'],
      getIntInput('browser-cache-duration'),
      getIntInput('cdn-cache-duration'));
    return;
  }


  // If we didn't get specific files, then deploy everything
  await syncToS3Bucket({
    localSource: getInput('public-source-path'),
    s3Bucket: getInput('dest-s3-bucket', {required: true}),
    s3Path: getInput('dest-s3-path'),
    syncDelete: getBooleanInput('sync-delete'),
    filesNotToBrowserCache: ['*.html', 'page-data/*.json', 'sw.js'],
    browserCacheDuration: getIntInput('browser-cache-duration'),
    cdnCacheDuration: getIntInput('cdn-cache-duration')
  })

  const cloudfrontIDToInvalidate = getInput('cloudfront-id-to-invalidate')
  if (cloudfrontIDToInvalidate) {
    await invalidateCloudfront({
      cloudfrontID: cloudfrontIDToInvalidate,
      paths: getInput('cloudfront-path-to-invalidate')
    })
  }
}

deploy().catch(error => {
  setFailed(error.message)
})
