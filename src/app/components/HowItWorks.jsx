export default function HowItWorks() {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Get started in minutes and begin your personalized learning journey
          </p>
        </div> 

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Tell Us What You Want to Learn
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Simply enter any topic you're interested in learning, from programming to cooking to music theory.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Get Your Custom Roadmap</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our AI analyzes your input and creates a structured learning path with clear milestones and resources.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Learn and Track Progress</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Follow your personalized roadmap, complete lessons, and track your progress as you master new skills.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
};
