import { useState } from "react";

import {
  Upload,
  Database
} from "lucide-react";

import { motion } from "framer-motion";

import FragmentAnimation from "./FragmentAnimation";

import sampleKeys from "../data/sampleKeys";

import {
  fragmentToken
} from "../services/api";

function TokenInputPanel() {

  // -----------------------------------
  // STATES
  // -----------------------------------

  // Active displayed tokens
  const [tokens, setTokens] =
    useState([]);

  // Uploaded JSON tokens
  const [uploadedTokens, setUploadedTokens] =
    useState([]);

  // Animation toggle
  const [showAnimation, setShowAnimation] =
    useState(false);

  // Uploaded filename
  const [uploadedFileName, setUploadedFileName] =
    useState("");


  // -----------------------------------
  // LOAD SAMPLE TOKENS
  // (NOW STORES TO BACKEND)
  // -----------------------------------

  const handleSampleTokens =
    async () => {

      try {

        // -----------------------------------
        // SEND SAMPLE TOKENS TO BACKEND
        // -----------------------------------

        for (const item of sampleKeys) {

          await fragmentToken(

            item.service,
            item.environment,
            item.owner,
            item.token

          );

        }

        // -----------------------------------
        // UPDATE FRONTEND VISUALIZATION
        // -----------------------------------

        setTokens(sampleKeys);

        // -----------------------------------
        // RESTART ANIMATION
        // -----------------------------------

        setShowAnimation(false);

        setTimeout(() => {

          setShowAnimation(true);

        }, 100);

        // -----------------------------------
        // REFRESH LIVE VAULTS
        // -----------------------------------

        setTimeout(() => {

          window.dispatchEvent(
            new Event("vault-update")
          );

        }, 500);

        alert(
          "Sample API keys fragmented and stored successfully."
        );

      } catch (error) {

        console.error(error);

        alert(
          "Failed to fragment sample keys."
        );

      }

    };


  // -----------------------------------
  // HANDLE FILE UPLOAD
  // -----------------------------------

  const handleFileUpload = (
    event
  ) => {

    const file =
      event.target.files[0];

    if (!file) return;

    setUploadedFileName(
      file.name
    );

    const reader =
      new FileReader();

    reader.onload = (e) => {

      try {

        const parsedData =
          JSON.parse(
            e.target.result
          );

        // -----------------------------------
        // VALIDATE REQUIRED FIELDS
        // -----------------------------------

        const validData =
          parsedData.filter(

            (item) =>

              item.service &&
              item.environment &&
              item.owner &&
              item.token

          );

        if (
          validData.length === 0
        ) {

          alert(
            "JSON file is missing required fields."
          );

          return;

        }

        setUploadedTokens(
          validData
        );

      } catch (error) {

        alert(
          "Invalid JSON File"
        );

      }

    };

    reader.readAsText(file);

  };


  // -----------------------------------
  // FRAGMENT UPLOADED TOKENS
  // -----------------------------------

  const handleFragmentUploadedKeys =
    async () => {

      if (
        uploadedTokens.length === 0
      ) {

        alert(
          "Please upload a JSON credential file first."
        );

        return;

      }

      try {

        // -----------------------------------
        // SEND EACH TOKEN TO BACKEND
        // -----------------------------------

        for (const item of uploadedTokens) {

          await fragmentToken(

            item.service,
            item.environment,
            item.owner,
            item.token

          );

        }

        console.log(
          "All uploaded keys fragmented successfully."
        );

        // -----------------------------------
        // UPDATE FRONTEND VISUALIZATION
        // -----------------------------------

        setTokens(
          uploadedTokens
        );

        // -----------------------------------
        // RESTART ANIMATION
        // -----------------------------------

        setShowAnimation(false);

        setTimeout(() => {

          setShowAnimation(true);

        }, 100);

        alert(
          "Uploaded API keys fragmented and stored successfully."
        );

        // -----------------------------------
        // REFRESH LIVE VAULTS
        // -----------------------------------

        setTimeout(() => {

          window.dispatchEvent(
            new Event("vault-update")
          );

        }, 500);

      } catch (error) {

        console.error(error);

        alert(
          "Failed to fragment uploaded keys."
        );

      }

    };


  return (

    <>

      <div className="grid md:grid-cols-2 gap-8 items-stretch">


        {/* ----------------------------------- */}
        {/* UPLOAD JSON KEYS */}
        {/* ----------------------------------- */}

        <motion.div

          whileHover={{ scale: 1.01 }}

          className="bg-[#111827]
            p-8 rounded-3xl
            border border-cyan-500
            shadow-2xl
            flex flex-col"

        >


          {/* Header */}
          <div className="flex items-center gap-3 mb-6">

            <Upload
              className="text-cyan-400"
              size={30}
            />

            <h2 className="text-3xl font-bold">

              Upload JSON Keys

            </h2>

          </div>


          {/* Description */}
          <p className="text-gray-400 mb-8">

            Upload enterprise API credential
            files for distributed fragmentation
            and secure vault allocation.

          </p>


          {/* Upload Area */}
          <label

            className="flex flex-col
              items-center justify-center
              border-2 border-dashed
              border-cyan-500
              rounded-2xl
              h-56 cursor-pointer
              hover:bg-[#1e293b]
              transition"

          >

            <Upload

              size={50}

              className="text-cyan-400 mb-4"

            />

            <p className="text-lg font-semibold text-white">

              Click to Upload JSON File

            </p>

            <p className="text-sm text-gray-400 mt-2">

              Supports .json credential files

            </p>


            {/* Uploaded File Name */}
            {uploadedFileName && (

              <p className="mt-4 text-green-400 font-semibold">

                ✔ {uploadedFileName} uploaded

              </p>

            )}


            <input

              type="file"

              accept=".json"

              onChange={handleFileUpload}

              className="hidden"

            />

          </label>


          {/* Fragment Button */}
          <div className="mt-auto pt-6">

            <button

              onClick={
                handleFragmentUploadedKeys
              }

              className="w-full
                bg-cyan-500
                hover:bg-cyan-400
                text-black
                font-bold py-4
                rounded-xl
                transition"

            >

              Fragment Uploaded Keys

            </button>

          </div>

        </motion.div>


        {/* ----------------------------------- */}
        {/* SAMPLE API KEYS */}
        {/* ----------------------------------- */}

        <motion.div

          whileHover={{ scale: 1.01 }}

          className="bg-[#111827]
            p-8 rounded-3xl
            border border-purple-500
            shadow-2xl
            flex flex-col"

        >


          {/* Header */}
          <div className="flex items-center gap-3 mb-6">

            <Database
              className="text-purple-400"
              size={30}
            />

            <h2 className="text-3xl font-bold">

              Sample API Keys

            </h2>

          </div>


          {/* Description */}
          <p className="text-gray-400 mb-8">

            Load preconfigured enterprise API
            credentials to simulate distributed
            secret fragmentation.

          </p>


          {/* Sample Services */}
          <div className="bg-[#0f172a]
            rounded-2xl p-6
            border border-purple-500">

            <div className="space-y-4">

              <div className="flex justify-between">
                <span>GitHub</span>
                <span className="text-gray-400">
                  Ready
                </span>
              </div>

              <div className="flex justify-between">
                <span>OpenAI</span>
                <span className="text-gray-400">
                  Ready
                </span>
              </div>

              <div className="flex justify-between">
                <span>AWS</span>
                <span className="text-gray-400">
                  Ready
                </span>
              </div>

              <div className="flex justify-between">
                <span>Stripe</span>
                <span className="text-gray-400">
                  Ready
                </span>
              </div>

              <div className="flex justify-between">
                <span>Discord</span>
                <span className="text-gray-400">
                  Ready
                </span>
              </div>

            </div>

          </div>


          {/* Load Sample Button */}
          <div className="mt-auto pt-6">

            <button

              onClick={handleSampleTokens}

              className="w-full
                bg-purple-500
                hover:bg-purple-400
                text-white
                font-bold py-4
                rounded-xl
                transition"

            >

              Fragment Sample Keys

            </button>

          </div>

        </motion.div>

      </div>


      {/* ----------------------------------- */}
      {/* FRAGMENT VISUALIZATION */}
      {/* ----------------------------------- */}

      {showAnimation && (

        <FragmentAnimation
          tokens={tokens}
        />

      )}

    </>

  );

}

export default TokenInputPanel;