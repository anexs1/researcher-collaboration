import {
  FaEthereum,
  FaMicroscope,
  FaBrain,
  FaDatabase,
  FaLock,
  FaFileAlt,
  FaGlobe,
  FaCloud,
} from "react-icons/fa";

const ResearchCategories = () => {
  const categories = [
    {
      name: "Quantum Computing",
      icon: <FaMicroscope />,
      color: "from-purple-500 to-indigo-600",
    },
    { name: "AI & ML", icon: <FaBrain />, color: "from-blue-500 to-teal-400" },
    {
      name: "Data Science",
      icon: <FaDatabase />,
      color: "from-green-500 to-emerald-400",
    },
    {
      name: "Cybersecurity",
      icon: <FaLock />,
      color: "from-red-500 to-pink-500",
    },
    {
      name: "Biomedical",
      icon: <FaFileAlt />,
      color: "from-amber-500 to-yellow-400",
    },
    {
      name: "Climate Science",
      icon: <FaGlobe />,
      color: "from-cyan-500 to-blue-400",
    },
    {
      name: "Blockchain",
      icon: <FaEthereum />,
      color: "from-gray-500 to-blue-800",
    },
    {
      name: "Cloud Computing",
      icon: <FaCloud />,
      color: "from-orange-500 to-red-400",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-gray-900 to-blue-900">
      {/* ... rest of your component ... */}
    </section>
  );
};
