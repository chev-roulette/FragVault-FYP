import {

  motion

} from "framer-motion";

import {

  Database,
  FileJson,
  ShieldCheck,
  AlertTriangle,
  ServerCrash

} from "lucide-react";


function AttackVaultCard({

  componentName,
  componentType,
  status,
  description,

}) {


  // ===================================
  // STATUS STYLING
  // ===================================

  const statusStyles = {

    SECURE: {

      container:
        "bg-[#111827] border-cyan-500",

      text:
        "text-green-400",

      icon:
        "text-cyan-400",

      label:
        "Secure",

    },

    EXPOSED: {

      container:
        "bg-red-950 border-red-500",

      text:
        "text-red-400",

      icon:
        "text-red-400",

      label:
        "Exposed",

    },

    TAMPERED: {

      container:
        "bg-orange-950 border-orange-500",

      text:
        "text-orange-400",

      icon:
        "text-orange-400",

      label:
        "Tampered",

    },

    UNAVAILABLE: {

      container:
        "bg-gray-900 border-gray-500",

      text:
        "text-gray-300",

      icon:
        "text-gray-400",

      label:
        "Unavailable",

    },

  };


  const currentStyle = (

    statusStyles[status]
    || statusStyles.SECURE

  );


  const isSecure = (

    status === "SECURE"

  );


  // ===================================
  // COMPONENT ICON
  // ===================================

  const ComponentIcon = (

    componentType === "index"

      ? FileJson

      : Database

  );


  return (

    <motion.div

      animate={

        !isSecure

          ? {

              scale: [
                1,
                1.02,
                1
              ],

            }

          : {}

      }

      transition={{

        repeat:
          !isSecure

            ? Infinity

            : 0,

        duration: 1.5,

      }}

      className={`rounded-3xl
        p-7 border
        shadow-2xl
        ${currentStyle.container}`}

    >


      {/* HEADER */}

      <div className="flex
        items-center
        justify-between
        gap-4 mb-6">

        <div className="flex
          items-center
          gap-4">

          <ComponentIcon

            size={38}

            className={
              currentStyle.icon
            }

          />

          <h3 className="text-2xl
            font-bold">

            {componentName}

          </h3>

        </div>


        <span className={`text-sm
          font-bold
          ${currentStyle.text}`}>

          ● {status}

        </span>

      </div>


      {/* DESCRIPTION */}

      <p className="text-gray-400
        leading-relaxed
        mb-6">

        {description}

      </p>


      {/* STATUS MESSAGE */}

      <div className="flex
        items-center
        gap-3">

        {

          status === "SECURE"

            ? (

              <ShieldCheck

                size={22}

                className="text-green-400"

              />

            )

            : status === "UNAVAILABLE"

              ? (

                <ServerCrash

                  size={22}

                  className="text-gray-400"

                />

              )

              : (

                <AlertTriangle

                  size={22}

                  className={
                    currentStyle.text
                  }

                />

              )

        }


        <span className={`font-semibold
          ${currentStyle.text}`}>

          {currentStyle.label}

        </span>

      </div>

    </motion.div>

  );

}


export default AttackVaultCard;