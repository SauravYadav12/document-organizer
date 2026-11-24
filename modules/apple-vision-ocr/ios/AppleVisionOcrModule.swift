import ExpoModulesCore
import Vision
import UIKit

public class AppleVisionOcrModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppleVisionOcr")

    AsyncFunction("recognizeText") { (uri: String, promise: Promise) in
      Self.recognize(uri: uri, promise: promise)
    }
  }

  private static func recognize(uri: String, promise: Promise) {
    let normalized = uri.hasPrefix("file://") ? uri : "file://\(uri)"
    guard let url = URL(string: normalized) else {
      promise.reject("E_BAD_URI", "Could not parse URI: \(uri)")
      return
    }

    let path = url.path
    guard let image = UIImage(contentsOfFile: path), let cgImage = image.cgImage else {
      promise.reject("E_IMAGE_LOAD", "Could not load image at \(path)")
      return
    }

    DispatchQueue.global(qos: .userInitiated).async {
      let request = VNRecognizeTextRequest { request, error in
        if let error = error {
          promise.reject("E_VISION", error.localizedDescription)
          return
        }
        let observations = (request.results as? [VNRecognizedTextObservation]) ?? []
        let lines = observations.compactMap { obs -> String? in
          guard let top = obs.topCandidates(1).first else { return nil }
          return top.string
        }
        promise.resolve(lines.joined(separator: "\n"))
      }

      request.recognitionLevel = .accurate
      request.usesLanguageCorrection = true
      request.automaticallyDetectsLanguage = true
      request.revision = VNRecognizeTextRequestRevision3

      let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
      do {
        try handler.perform([request])
      } catch {
        promise.reject("E_VISION_PERFORM", error.localizedDescription)
      }
    }
  }
}
