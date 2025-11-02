const unityInstance = UnityLoader.instantiate("unityContainer", "Build/Build.json");
let isCameraReady = false;
let isDetectionManagerReady = false;
let gl = null;

function cameraReady(){
    isCameraReady = true;
    gl = unityInstance.Module.ctx;
}

function detectionManagerReady(){
    isDetectionManagerReady = true;
}

function createUnityMatrix(el){
    const m = el.matrix.clone();
    const zFlipped = new THREE.Matrix4().makeScale(1, 1, -1).multiply(m);
    const rotated = zFlipped.multiply(new THREE.Matrix4().makeRotationX(-Math.PI/2));
    return rotated;
}

AFRAME.registerComponent('markercontroller', {
    schema: {
        name : {type: 'string'}
    },
    tock: function(time, timeDelta){

        let position = new THREE.Vector3();
        let rotation = new THREE.Quaternion();
        let scale = new THREE.Vector3();

        createUnityMatrix(this.el.object3D).decompose(position, rotation, scale);

        const serializedInfos = `${this.data.name},${this.el.object3D.visible},${position.toArray()},${rotation.toArray()},${scale.toArray()}`;

        if(isDetectionManagerReady){
          unityInstance.SendMessage("DetectionManager", "markerInfos", serializedInfos);
        }
    } 
});

AFRAME.registerComponent('cameratransform', {
    tock: function(time, timeDelta){

        let camtr = new THREE.Vector3();
        let camro = new THREE.Quaternion();
        let camsc = new THREE.Vector3();

        this.el.object3D.matrix.clone().decompose(camtr, camro, camsc);

        const projection = this.el.components.camera.camera.projectionMatrix.clone();
        const serializedProj = `${[...projection.elements]}`

        const posCam = `${[...camtr.toArray()]}`
        const rotCam = `${[...camro.toArray()]}`
 
        if(isCameraReady){
            unityInstance.SendMessage("Main Camera", "setProjection", serializedProj);
            unityInstance.SendMessage("Main Camera", "setPosition", posCam);
            unityInstance.SendMessage("Main Camera", "setRotation", rotCam);

            let w = window.innerWidth;
            let h = window.innerHeight; 

            const unityCanvas = document.getElementsByTagName('canvas')[0];

            const ratio = unityCanvas.height / h;

            w *= ratio
            h *= ratio

            const size = `${w},${h}`

            unityInstance.SendMessage("Canvas", "setSize", size);
        }

        if(gl != null){
            gl.dontClearOnFrameStart = true;
        }
    } 
});

AFRAME.registerComponent('markercontroller', {
    schema: {
        name : {type: 'string'}
    },
    tock: function(time, timeDelta){

        let position = new THREE.Vector3();
        let rotation = new THREE.Quaternion();
        let scale = new THREE.Vector3();

        // -----------------------------
        // Per-marker rotation offset
        // -----------------------------
        // Define offsets here (Euler angles in radians)
        let offsetRotation = new THREE.Euler(0, 0, 0); // default no rotation

        if(this.data.name === "Nutty"){
            offsetRotation = new THREE.Euler(0, Math.PI/2, 0); // 90° Y rotation
        } 
        else if(this.data.name === "Hiro"){
            offsetRotation = new THREE.Euler(0, Math.PI, 0); // example: 180° for Hiro
        }

        // create the matrix including the offset
        const matrix = createUnityMatrix(this.el.object3D, offsetRotation);

        matrix.decompose(position, rotation, scale);

        const serializedInfos = `${this.data.name},${this.el.object3D.visible},${position.toArray()},${rotation.toArray()},${scale.toArray()}`;

        if(isDetectionManagerReady){
          unityInstance.SendMessage("DetectionManager", "markerInfos", serializedInfos);
        }
    } 
});

// -----------------------------
// Modified createUnityMatrix to accept offsetRotation
// -----------------------------
function createUnityMatrix(el, offsetRotation = new THREE.Euler(0,0,0)){
    const m = el.matrix.clone();

    // apply offset rotation locally
    const offsetMat = new THREE.Matrix4().makeRotationFromEuler(offsetRotation);
    m.multiply(offsetMat);

    const zFlipped = new THREE.Matrix4().makeScale(1, 1, -1).multiply(m);
    const rotated = zFlipped.multiply(new THREE.Matrix4().makeRotationX(-Math.PI/2));
    return rotated;
}
