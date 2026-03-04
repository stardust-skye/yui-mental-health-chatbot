import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VRMLoaderPlugin } from "@pixiv/three-vrm";

const YuiAvatar3D = ({ avatar, background }) => {

    const mountRef = useRef(null);

    useEffect(() => {

        if (!mountRef.current) return;

        mountRef.current.innerHTML = "";

        const scene = new THREE.Scene();

        // 🌅 Dynamic background
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(`/backgrounds/${background}`, (texture) => {
            scene.background = texture;
        });

        const camera = new THREE.PerspectiveCamera(
            30,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );

        camera.position.set(0, 1.55, 1.1);
        camera.lookAt(0, 1.55, 0);

        const renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        renderer.setSize(
            mountRef.current.clientWidth,
            mountRef.current.clientHeight
        );

        mountRef.current.appendChild(renderer.domElement);

        // lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1);
        scene.add(light);

        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambient);

        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));

        let currentVrm = null;

        let blinkTimer = 0;
        let mouthTimer = 0;

        const avatarPath = `/avatars/${avatar}.vrm`;

        loader.load(
            avatarPath,
            (gltf) => {

                const vrm = gltf.userData.vrm;

                vrm.scene.rotation.y = Math.PI;

                scene.add(vrm.scene);

                currentVrm = vrm;

            },
            undefined,
            (error) => {
                console.error("Avatar load error:", error);
            }
        );

        const clock = new THREE.Clock();

        const animate = () => {

            requestAnimationFrame(animate);

            const delta = clock.getDelta();

            if (currentVrm) {

                currentVrm.update(delta);

                const exp = currentVrm.expressionManager;

                if (exp) {

                    exp.resetValues();

                    // blinking
                    blinkTimer += delta;

                    if (blinkTimer > 3) {
                        exp.setValue("blink", 1);
                        if (blinkTimer > 3.15) blinkTimer = 0;
                    }

                    // lip sync
                    if (window.speechSynthesis.speaking) {

                        mouthTimer += delta * 10;

                        const mouthOpen =
                            (Math.sin(mouthTimer) + 1) / 2;

                        exp.setValue("aa", mouthOpen);

                    } else {

                        mouthTimer = 0;

                    }

                }

                // breathing motion
                currentVrm.scene.position.y =
                    0.02 * Math.sin(clock.elapsedTime * 1.2);

                // eye contact
                if (currentVrm.lookAt) {
                    currentVrm.lookAt.target = camera;
                }

            }

            renderer.render(scene, camera);

        };

        animate();

        // ⭐ resize observer
        const resizeObserver = new ResizeObserver(() => {

            if (!mountRef.current) return;

            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);

        });

        resizeObserver.observe(mountRef.current);

        return () => {

            resizeObserver.disconnect();
            renderer.dispose();

        };

    }, [avatar, background]);

    return (
        <div
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden"
            }}
        />
    );

};

export default YuiAvatar3D;