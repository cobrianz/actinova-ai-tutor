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

export function requestStoragePermission() {
  if (!isFlutterApp()) return Promise.resolve(true)
  return new Promise((resolve) => {
    if (window.FlutterStorage) {
      window.FlutterStorage.requestPermission().then(resolve).catch(() => resolve(false))
    } else {
      // Try via postMessage pattern
      try {
        window.FlutterDownload.postMessage(JSON.stringify({ type: "requestStoragePermission" }))
        resolve(true)
      } catch {
        resolve(false)
      }
    }
  })
}
