export function isFlutterApp() {
  return typeof window !== 'undefined' && window.FlutterDownload !== undefined
}

export function downloadViaFlutter(url, filename) {
  if (!isFlutterApp()) return false
  window.FlutterDownload.postMessage(JSON.stringify({ url, filename }))
  return true
}

export async function saveBlobViaFlutter(blob, filename) {
  if (!isFlutterApp()) return false
  const reader = new FileReader()
  return new Promise((resolve) => {
    reader.onloadend = () => {
      downloadViaFlutter(reader.result, filename)
      resolve(true)
    }
    reader.readAsDataURL(blob)
  })
}
