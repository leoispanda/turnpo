#import <AppKit/AppKit.h>
#import <Foundation/Foundation.h>
#import <PDFKit/PDFKit.h>
#import <Vision/Vision.h>

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        if (argc < 3) {
            fprintf(stderr, "Usage: ocr-pdf input.pdf output.json [firstPage] [lastPage]\n");
            return 2;
        }

        NSString *inputPath = [NSString stringWithUTF8String:argv[1]];
        NSString *outputPath = [NSString stringWithUTF8String:argv[2]];
        PDFDocument *document = [[PDFDocument alloc] initWithURL:[NSURL fileURLWithPath:inputPath]];
        if (!document || document.pageCount == 0) {
            fprintf(stderr, "Unable to open PDF\n");
            return 1;
        }

        NSInteger firstPage = argc > 3 ? MAX(1, atoi(argv[3])) : 1;
        NSInteger lastPage = argc > 4 ? MIN(document.pageCount, atoi(argv[4])) : document.pageCount;
        NSMutableArray *output = [NSMutableArray array];

        for (NSInteger pageNumber = firstPage; pageNumber <= lastPage; pageNumber++) {
            @autoreleasepool {
                PDFPage *page = [document pageAtIndex:pageNumber - 1];
                CGRect bounds = [page boundsForBox:kPDFDisplayBoxMediaBox];
                CGFloat scale = 2.5;
                size_t width = MAX(1, (size_t)ceil(bounds.size.width * scale));
                size_t height = MAX(1, (size_t)ceil(bounds.size.height * scale));
                CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
                CGContextRef context = CGBitmapContextCreate(NULL, width, height, 8, 0, colorSpace,
                    kCGImageAlphaPremultipliedLast);
                CGColorSpaceRelease(colorSpace);
                if (!context) continue;

                CGContextSetRGBFillColor(context, 1, 1, 1, 1);
                CGContextFillRect(context, CGRectMake(0, 0, width, height));
                CGContextSaveGState(context);
                CGContextScaleCTM(context, scale, scale);
                [page drawWithBox:kPDFDisplayBoxMediaBox toContext:context];
                CGContextRestoreGState(context);
                CGImageRef image = CGBitmapContextCreateImage(context);
                CGContextRelease(context);
                if (!image) continue;

                VNRecognizeTextRequest *request = [[VNRecognizeTextRequest alloc] init];
                request.recognitionLevel = VNRequestTextRecognitionLevelAccurate;
                request.usesLanguageCorrection = YES;
                request.recognitionLanguages = @[@"en-US"];
                VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCGImage:image options:@{}];
                NSError *error = nil;
                BOOL success = [handler performRequests:@[request] error:&error];
                CGImageRelease(image);
                if (!success) {
                    fprintf(stderr, "OCR failed on page %ld: %s\n", (long)pageNumber,
                        error.localizedDescription.UTF8String);
                    continue;
                }

                NSArray<VNRecognizedTextObservation *> *observations = [request.results sortedArrayUsingComparator:
                    ^NSComparisonResult(VNRecognizedTextObservation *a, VNRecognizedTextObservation *b) {
                        CGFloat dy = CGRectGetMidY(a.boundingBox) - CGRectGetMidY(b.boundingBox);
                        if (fabs(dy) > 0.012) return dy > 0 ? NSOrderedAscending : NSOrderedDescending;
                        CGFloat dx = CGRectGetMinX(a.boundingBox) - CGRectGetMinX(b.boundingBox);
                        return dx < 0 ? NSOrderedAscending : NSOrderedDescending;
                    }];
                NSMutableArray<NSString *> *lines = [NSMutableArray array];
                for (VNRecognizedTextObservation *observation in observations) {
                    VNRecognizedText *candidate = [[observation topCandidates:1] firstObject];
                    if (candidate.string.length > 0) [lines addObject:candidate.string];
                }
                [output addObject:@{@"page": @(pageNumber), @"text": [lines componentsJoinedByString:@"\n"]}];
                fprintf(stderr, "OCR page %ld/%ld\n", (long)pageNumber, (long)lastPage);
            }
        }

        NSError *jsonError = nil;
        NSData *json = [NSJSONSerialization dataWithJSONObject:output options:NSJSONWritingPrettyPrinted error:&jsonError];
        if (!json || ![json writeToFile:outputPath options:NSDataWritingAtomic error:&jsonError]) {
            fprintf(stderr, "Unable to write OCR output: %s\n", jsonError.localizedDescription.UTF8String);
            return 1;
        }
    }
    return 0;
}
