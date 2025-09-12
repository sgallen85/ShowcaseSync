
const sdkKey = "my1unmcyza10z52eknxb971wa";
const host = document.getElementById("showcase-host");
const client = document.getElementById("showcase-client");
let counter = 0;
let name;;

// Welcome to Game
const startGame = () => {

      // Hide Welcome Screen
      document.getElementById("game-start-screen").style.display = 'none';
      // Show Game
      document.getElementById("game-interface").style.display = 'block';
      // Set countdown to 5 min
      document.getElementById('timer').innerHTML = 5 + ":" + 00;


      // Initialize Game Timer
      startGameTimer();
      startTimer();
}

// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Start Game Timer
const startGameTimer = () => {
  setInterval(() => {
    counter++;
    console.log(counter);
    //document.getElementById("timer").innerText = counter;
    // see if counter reached 5 mins
    if (counter === 15) {
      // Show Game Over Banner
      document.getElementById("game-over-banner").style.opacity = "1";
      document.getElementById("game-over-banner").style.zIndex = 1000000;
      // Call function to restart the game
      reload();
      return;
    }
  }, 1000);
}

// Wait 15 seconds after game ends then rolad the webpage to restart the game
async function reload(){
  await sleep(15000);
  location.reload();
  console.log("reboot");
}

// Creats min / sec timer for game display (I know it's redundant, don't care)
function startTimer() {
  var presentTime = document.getElementById('timer').innerHTML;
  var timeArray = presentTime.split(/[:]+/);
  var m = timeArray[0];
  var s = checkSecond((timeArray[1] - 1));
  if(s==59){m=m-1}
  if(m<0){
    return
  }

  document.getElementById('timer').innerHTML =
    m + ":" + s;
  console.log(m)
  setTimeout(startTimer, 1000);

}

function checkSecond(sec) {
  if (sec < 10 && sec >= 0) {sec = "0" + sec}; // add zero in front of numbers < 10
  if (sec < 0) {sec = "59"};
  return sec;
}




// Create Command Observer
let cmd = {
  aInternal: 1,
  aListener: function (val) {},
  set a(val) {
    this.aInternal = val;
    this.aListener(val);
  },
  get a() {
    return this.aInternal;
  },
  registerListener: function (listener) {
    this.aListener = listener;
  },
};

// Create Promise Queue
class PromiseQueue {
  queue = Promise.resolve(true);
  add(operation) {
    return new Promise((resolve, reject) => {
      this.queue = this.queue.then(operation).then(resolve).catch(reject);
    });
  }
}
var pq = new PromiseQueue();

(async function connectSdkHost() {
  try {
    const mpSdkHost = await window.MP_SDK.connect(
      host, // Obtained earlier
      sdkKey, // Your SDK key
      "" // Unused but needs to be a valid string
    );
    onHostConnect(mpSdkHost);

    // Now connect the client
    (async function connectSdkClient() {
      try {
        const mpSdkClient = await window.MP_SDK.connect(
          client, // Obtained earlier
          sdkKey, // Your SDK key
          "" // Unused but needs to be a valid string
        );
        onClientConnect(mpSdkClient);
      } catch (e) {
        console.error(e);
      }
    })();
  } catch (e) {
    console.error(e);
  }
})();

var hostZoom = 1;

async function onHostConnect(mpSdk) {
  await mpSdk.App.state.waitUntil(
    (appState) => appState.phase == "appphase.playing"
  );
  console.log("Host Connected");

  mpSdk.Camera.pose.subscribe(function (pose) {
    let tryPan = false; // Try Camera.pan instead of Mode.setMode
    if (
      (tryPan && pose.mode == "mode.dollhouse") ||
      pose.mode == "mode.floorplan"
    ) {
      cmd.a = {
        cmd: "moveTo3D",
        val: pose,
      };
    } else if (pose.mode !== "mode.transitioning") {
      cmd.a = {
        cmd: "moveTo",
        val: pose,
      };
    }
  });
  // Attempt to sync leaving a sweep
  mpSdk.on(mpSdk.Sweep.Event.EXIT, function (fromSweep, toSweep) {
    if (toSweep !== undefined) {
      cmd.a = {
        cmd: "sweepExit",
        val: toSweep,
      };
    }
  });
  // Observe changes to the Sweep ID -- Force sync
  mpSdk.Sweep.current.subscribe(function (currentSweep) {
    if (currentSweep.sid !== "") {
      cmd.a = {
        cmd: "sweepEnter",
        val: currentSweep.id,
      };
    }
  });
  mpSdk.on(mpSdk.Mode.Event.CHANGE_START, function (oldMode, newMode) {
    cmd.a = {
      cmd: "newMode",
      val: newMode,
    };
  });
  mpSdk.Camera.zoom.subscribe(function (zoom) {
    // the zoom level has changed
    hostZoom = zoom.level;
    cmd.a = {
      cmd: "zoom",
      val: zoom.level,
    };
  });
  // Sync Tags
//  mpSdk.Tag.openTags.subscribe({
//    prevState: {
//      hovered: null,
//      docked: null,
//      selected: null,
//    },
//    onChanged(newState) {
//     if (newState.hovered !== this.prevState.hovered) {
//       if (newState.hovered) {
//          cmd.a = {
//            cmd: "tagOpen",
//          val: newState.hovered,
 //       };
 //    } else {
  //      cmd.a = {
    //        cmd: "tagClose",
    //        val: this.prevState.hovered,
    //      };
    //    }
   //   }
//      if (newState.docked !== this.prevState.docked) {
//        if (newState.docked) {
//          cmd.a = {
//            cmd: "tagDock",
//            val: newState.docked,
//          };
//        } else {
//          cmd.a = {
//            cmd: "tagClose",
//            val: this.prevState.docked,
//          };
//        }
//      }

      // only compare the first 'selected' since only one tag is currently supported
//      const [selected = null] = newState.selected; // destructure and coerce the first Set element to null
//      if (selected !== this.prevState.selected) {
//        if (selected) {
//          cmd.a = {
//            cmd: "tagOpen",
//            val: selected,
//          };
//        } else {
//          cmd.a = {
//            cmd: "tagClose",
//            val: this.prevState.selected,
//          };
//        }
//      }

      // clone and store the new state
//      this.prevState = {
//       ...newState,
//        selected,
//      };
//    },
//  });
}

async function onClientConnect(mpSdk) {
  await mpSdk.App.state.waitUntil(
    (appState) => appState.phase == "appphase.playing"
  );
  console.log("Client Connected");
  // Observe which sweep the client is on.
  cmd.registerListener(async function (val) {
    switch (val.cmd) {
//      case "tagOpen":
//        mpSdk.Tag.open(val.val);
//        break;
//      case "tagClose":
//        mpSdk.Tag.close(val.val);
//        break;
//      case "tagDock":
//        mpSdk.Tag.dock(val.val);
//        break;
//      case "tagClose":
//        mpSdk.Tag.close(val.val);
//        break;

      case "moveTo":
        let moveTo = (resp) =>
          new Promise((resolve, reject) => {
            mpSdk.Mode.moveTo(val.val.mode, {
              position: val.val.position,
              rotation: val.val.rotation,
              transition: "transition.instant",
              zoom: hostZoom,
            })
              .then(function (nextMode) {
                // Move successful.
                resolve(true);
              })
              .catch(function (error) {
                reject(error);
              });
          });
        pq.add(moveTo);
        break;
      case "moveTo3D":
        let moveTo3D = (resp) =>
          new Promise((resolve, reject) => {
            mpSdk.Camera.pan(val.val.position)
              .then(function (nextMode) {
                // Move successful.
                resolve(true);
              })
              .catch(function (error) {
                reject(error);
              });
          });
        pq.add(moveTo3D);
        break;
      case "sweepEnter":
      case "sweepExit":
        let newSweep = (resp) =>
          new Promise((resolve, reject) => {
            mpSdk.Sweep.moveTo(val.val, {
              transition: "transition.fly",
            })
              .then(function (newSweep) {
                // Move successful.
                resolve("Arrived at new sweep " + newSweep);
              })
              .catch(function (error) {
                reject(error);
              });
          });
        pq.add(newSweep);
        break;
      case "newMode":
        let newMode = (resp) =>
          new Promise((resolve, reject) => {
            mpSdk.Mode.moveTo(val.val, {
              transition: "transition.instant",
            })
              .then(function (newMode) {
                // Move successful.
                resolve(true);
              })
              .catch(function (error) {
                reject(error);
              });
          });
        pq.add(newMode);
        break;
      case "zoom":
        mpSdk.Camera.zoomTo(val.val).then(function (newZoom) {
          console.log("Camera zoomed to", newZoom);
        });
        break;
    }
  });
}

