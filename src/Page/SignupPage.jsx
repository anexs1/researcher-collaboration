import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserGraduate,
  faBuilding,
  faStethoscope,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

const SignUp = () => {
  const navigate = useNavigate();

  const handleSignUpClick = (userType) => {
    navigate(`/signup/${userType}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        {/* Back to Home Button */}
        <div className="text-left w-full">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Home
          </Link>
        </div>

        <div>
          <h1 className="text-5xl font-extrabold text-gray-900 text-center leading-tight">
            Join Research Pioneers
          </h1>
          <p className="mt-3 text-center text-xl text-gray-600">
            Connect with over the World researchers, including Nobel Laureates.
            Collaborate, discover, and elevate your research impact.
          </p>
        </div>

        <div>
          <h2 className="mt-8 text-center text-3xl font-semibold text-gray-700">
            Explore Your Path
          </h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <button
              onClick={() => handleSignUpClick("academic")}
              className="group relative block overflow-hidden bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:scale-105 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
            >
              <span className="sr-only">Academic or Student</span>
              <span className="absolute inset-0" aria-hidden="true" />
              <div className="p-6 flex flex-col items-center justify-center">
                <div className="h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors duration-300 mb-4">
                  <FontAwesomeIcon
                    icon={faUserGraduate}
                    size="lg"
                    className="text-blue-500"
                  />
                </div>
                <span className="block text-xl font-medium text-gray-900 text-center group-hover:text-blue-700 transition-colors duration-300">
                  Academic or Student
                </span>
              </div>
            </button>

            <button
              onClick={() => handleSignUpClick("corporate")}
              className="group relative block overflow-hidden bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:scale-105 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
            >
              <span className="sr-only">Corporate, Government, or NGO</span>
              <span className="absolute inset-0" aria-hidden="true" />
              <div className="p-6 flex flex-col items-center justify-center">
                <div className="h-16 w-16 flex items-center justify-center rounded-full bg-green-100 group-hover:bg-green-200 transition-colors duration-300 mb-4">
                  <FontAwesomeIcon
                    icon={faBuilding}
                    size="lg"
                    className="text-green-500"
                  />
                </div>
                <span className="block text-xl font-medium text-gray-900 text-center group-hover:text-green-700 transition-colors duration-300">
                  Corporate, Government, or NGO
                </span>
              </div>
            </button>

            <button
              onClick={() => handleSignUpClick("medical")}
              className="group relative block overflow-hidden bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:scale-105 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
            >
              <span className="sr-only">Medical</span>
              <span className="absolute inset-0" aria-hidden="true" />
              <div className="p-6 flex flex-col items-center justify-center">
                <div className="h-16 w-16 flex items-center justify-center rounded-full bg-red-100 group-hover:bg-red-200 transition-colors duration-300 mb-4">
                  <FontAwesomeIcon
                    icon={faStethoscope}
                    size="lg"
                    className="text-red-500"
                  />
                </div>
                <span className="block text-xl font-medium text-gray-900 text-center group-hover:text-red-700 transition-colors duration-300">
                  Medical
                </span>
              </div>
            </button>

            <button
              onClick={() => handleSignUpClick("not-researcher")}
              className="group relative block overflow-hidden bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:scale-105 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
            >
              <span className="sr-only">Not a Researcher</span>
              <span className="absolute inset-0" aria-hidden="true" />
              <div className="p-6 flex flex-col items-center justify-center">
                <div className="h-16 w-16 flex items-center justify-center rounded-full bg-yellow-100 group-hover:bg-yellow-200 transition-colors duration-300 mb-4">
                  <FontAwesomeIcon
                    icon={faUser}
                    size="lg"
                    className="text-yellow-500"
                  />
                </div>
                <span className="block text-xl font-medium text-gray-900 text-center group-hover:text-yellow-700 transition-colors duration-300">
                  Not a Researcher
                </span>
              </div>
            </button>
          </div>
        </div>

        <p className="text-center">
          <Link to="/login" className="text-blue-600 hover:underline text-lg">
            Already have an account? Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
