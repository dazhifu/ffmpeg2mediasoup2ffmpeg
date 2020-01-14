const mediasoup = require("mediasoup");
const config = require("./config");

(async () => {
  const worker = await mediasoup.createWorker({
    logLevel: config.mediasoup.worker.logLevel,
    logTags: config.mediasoup.worker.logTags,
    rtcMinPort: config.mediasoup.worker.rtcMinPort,
    rtcMaxPort: config.mediasoup.worker.rtcMaxPort
  });

  worker.on("died", () => {
    console.error(
      "mediasoup worker died, exiting in 2 seconds... [pid:%d]",
      worker.pid
    );
    setTimeout(() => process.exit(1), 2000);
  });

  const mediaCodecs = config.mediasoup.router.mediaCodecs;
  const router = await worker.createRouter({ mediaCodecs });
  const rtpCapabilities = router.rtpCapabilities;

  const producerTransport = await router.createPlainRtpTransport({
    listenIp: "127.0.0.1",
    rtcpMux: false,
    comedia: true
  });

  const producerRtpPort = producerTransport.tuple.localPort;
  console.log({ producerRtpPort });
  const producerRtcpPort = producerTransport.rtcpTuple.localPort;
  console.log({ producerRtcpPort });

  const producer = await producerTransport.produce({
    kind: "video",
    rtpParameters: {
      codecs: [
        {
          mimeType: "video/vp8",
          clockRate: 90000,
          payloadType: 102,
          rtcpFeedback: [] // FFmpeg does not support NACK nor PLI/FIR.
        }
      ],
      encodings: [{ ssrc: 22222222 }]
    }
  });

  const consumerTransport = await router.createPlainRtpTransport({
    listenIp: "127.0.0.1",
    rtcpMux: false,
    comedia: true
  });

  const consumerRtpPort = consumerTransport.tuple.localPort;
  console.log({ consumerRtpPort });
  const consumerRtcpPort = consumerTransport.rtcpTuple.localPort;
  console.log({ consumerRtcpPort });

  const consumer = await consumerTransport.consume({
    producerId: producer.id,
    rtpCapabilities,
    paused: true
  });

  setTimeout(async () => {
    await consumer.resume();
  }, 1000);
})();
