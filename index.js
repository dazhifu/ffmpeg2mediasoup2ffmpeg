const mediasoup = require("mediasoup");
const config = require("./config");
const FFmpeg = require("./ffmpeg");
const { getPort, releasePort } = require("./port");

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

  const audioTransport = await router.createPlainRtpTransport({
    listenIp: "127.0.0.1",
    rtcpMux: false
  });

  const audioRtpPort = audioTransport.tuple.localPort;
  const audioRtcpPort = audioTransport.rtcpTuple.localPort;

  const videoTransport = await router.createPlainRtpTransport({
    listenIp: "127.0.0.1",
    rtcpMux: false,
    comedia: true
  });

  const videoRtpPort = videoTransport.tuple.localPort;
  const videoRtcpPort = videoTransport.rtcpTuple.localPort;

  console.log(
    `bash push.sh ${audioRtpPort} ${audioRtcpPort} ${videoRtpPort} ${videoRtcpPort}`
  );

  const audioProducer = await audioTransport.produce({
    kind: "audio",
    rtpParameters: {
      codecs: [
        {
          mimeType: "audio/opus",
          clockRate: 48000,
          payloadType: 101,
          channels: 2,
          rtcpFeedback: [],
          parameters: { "sprop-stereo": 1 }
        }
      ],
      encodings: [{ ssrc: 11111111 }]
    }
  });

  const videoProducer = await videoTransport.produce({
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

  // videoProducer.on("sctpstatechange", e => {
  //   console.log(e);
  // });

  [
    "close",
    "newproducer",
    "newconsumer",
    "newdataproducer",
    "newdataconsumer",
    "trace",
    "sctpstatechange",
    "pause",
    "resume",
    "score",
    "videoorientationchange",
    "layerschange"
  ].forEach(item => {
    videoProducer.on(item, e => {
      console.log(11, item, e);
    });
  });

  [
    "close",
    "newproducer",
    "newconsumer",
    "newdataproducer",
    "newdataconsumer",
    "trace",
    "sctpstatechange",
    "pause",
    "resume",
    "score",
    "videoorientationchange",
    "layerschange"
  ].forEach(item => {
    videoProducer.observer.on(item, async(e) => {
      console.log(item, e);

      await consumer.resume();

      const recordInfo = {
        video: {
          remoteRtpPort,
          localRtpPort: consumerRtpPort,
          localRtcpPort: consumerRtcpPort,
          rtpCapabilities,
          rtpParameters: videoProducer.rtpParameters
        }
      };
      recordInfo.fileName = Date.now().toString();
      const f = new FFmpeg(recordInfo);
      setTimeout(() => {
        f.kill();
      }, 5000);

    });
  });

  // =============================================================================
  // =============================================================================
  // =============================================================================
  // =============================================================================
  // =============================================================================

  const consumerTransport = await router.createPlainRtpTransport({
    listenIp: "127.0.0.1",
    rtcpMux: false
  });

  const consumerRtpPort = consumerTransport.tuple.localPort;
  const consumerRtcpPort = consumerTransport.rtcpTuple.localPort;

  const remoteRtpPort = await getPort();
  const remoteRtcpPort = await getPort();
  console.log({
    remoteRtpPort,
    remoteRtcpPort
  });

  await consumerTransport.connect({
    ip: "127.0.0.1",
    port: remoteRtpPort,
    rtcpPort: remoteRtcpPort
  });

  const consumer = await consumerTransport.consume({
    producerId: videoProducer.id,
    rtpCapabilities,
    paused: true
  });

  [
    "close",
    "newproducer",
    "newconsumer",
    "newdataproducer",
    "newdataconsumer",
    "trace",
    "sctpstatechange",
    "pause",
    "resume",
    "score",
    "videoorientationchange",
    "layerschange"
  ].forEach(item => {
    consumer.on(item, e => {
      console.log(33, item, e);
    });
  });

 
})();
