import { motion } from "framer-motion";

function StatCard({
  title,
  value,
  color,
  description,
}) {

  return (

    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`rounded-3xl p-8 border shadow-2xl ${color}`}
    >

      {/* Title */}
      <h2 className="text-2xl font-bold mb-4">
        {title}
      </h2>

      {/* Value */}
      <div className="text-5xl font-bold mb-4">
        {value}
      </div>

      {/* Description */}
      <p className="text-gray-300 leading-relaxed">
        {description}
      </p>

    </motion.div>

  );

}

export default StatCard;