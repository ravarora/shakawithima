import './App.css';
import { useEffect, useRef, useState } from 'react';
import shaka from 'shaka-player';

function App() {
  const videoElementRef = useRef();
  const videoContainerRef = useRef();
  const adContainerRef = useRef();
  const shakaPlayerRef = useRef();
  const adsManagerRef = useRef();
  const adsDisplayContainerRef = useRef();
  const [isPlayingAd, setIsPlayingAd] = useState(false);

  const manifestUri = 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd';
  const adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/vmap_ad_samples&sz=640x480&cust_params=sample_ar%3Dpremidpostpod&ciu_szs=300x250&gdfp_req=1&ad_rule=1&output=vmap&unviewed_position_start=1&env=vp&impl=s&cmsid=496&vid=short_onecue&correlator=';

  // Initialize IMA SDK
  const initImaSdk = () => {
    console.log(`Init IMA SDK`)
    adsDisplayContainerRef.current = new window.google.ima.AdDisplayContainer(adContainerRef.current, videoElementRef.current);
    adsDisplayContainerRef.current.initialize();
    const adsLoader = new window.google.ima.AdsLoader(adsDisplayContainerRef.current);

    // Handle ads manager loading event
    adsLoader.addEventListener(
      window.google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      onAdManagerLoaded,
      false
    );

    // Request ads
    const adsRequest = new window.google.ima.AdsRequest();
    adsRequest.adTagUrl = adTagUrl;
    adsRequest.linearAdSlotWidth = videoElementRef.clientWidth;
    adsRequest.linearAdSlotHeight = videoElementRef.clientHeight;
    adsLoader.requestAds(adsRequest);
  };

  const onAdManagerLoaded = (event) => {
    adsManagerRef.current = event.getAdsManager(videoElementRef.current);
    adsManagerRef.current.addEventListener(window.google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, onContentPauseRequested);
    adsManagerRef.current.addEventListener(window.google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, onContentResumeRequested);
  }

  // Load the main content (the video)
  const loadMainContent = async () => {
    console.log(`load main Content`)
    try {
      await shakaPlayerRef.current.load(manifestUri);
    } catch (e) {
      console.error('Error loading content', e);
    }
  };

  // Initialize the Shaka Player
  const intiPlayer = async () => {
    console.log(`Init Player`)
    shaka.polyfill.installAll();
    shakaPlayerRef.current = new shaka.Player(videoElementRef.current);
    videoElementRef.current.addEventListener("playing", () => {
      playAds()
    }, { once: true });
  };

  const playAds = () => {
    adsManagerRef.current.init(videoElementRef.current.width, videoElementRef.current.height, window.google.ima.ViewMode.NORMAL)
    adsManagerRef.current.start();
  }


  // Pause the content when an ad is requested
  const onContentPauseRequested = () => {
    console.log('Pausing content');
    setIsPlayingAd(true)
    videoElementRef.current.pause();
  };

  // Resume the content when ads are finished
  const onContentResumeRequested = () => {
    console.log('Resuming content');
    setIsPlayingAd(false)
    videoElementRef.current.play();
  };

  useEffect(() => {
    intiPlayer();
    initImaSdk();
    loadMainContent();
  }, []);

  return (
    <>
      <div ref={videoContainerRef}>
        <video ref={videoElementRef} controls muted width='1920' height='1080' style={{ width: '100%', height: '100%' }} />
        <div ref={adContainerRef} hidden={!isPlayingAd} style={{ position: 'absolute', top: 0, left: 0, width: '100%'}} ></div>
      </div>
    </>
  );
}

export default App;
