import React from "react";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import { Award, Briefcase, GraduationCap, TrendingUp } from "lucide-react";

const students = [
  { id: 1, name: "Rahul Sharma", company: "Google", package: "45 LPA", role: "Software Engineer", image: "https://i.pravatar.cc/150?u=rahul" },
  { id: 2, name: "Priya Patel", company: "Microsoft", package: "42 LPA", role: "SDE-1", image: "https://i.pravatar.cc/150?u=priya" },
  { id: 3, name: "Anish Kumar", company: "Amazon", package: "40 LPA", role: "Cloud Architect", image: "https://i.pravatar.cc/150?u=anish" },
  { id: 4, name: "Sneha Reddy", company: "Adobe", package: "38 LPA", role: "Product Designer", image: "https://i.pravatar.cc/150?u=sneha" },
  { id: 5, name: "Vikram Singh", company: "Meta", package: "50 LPA", role: "Data Scientist", image: "https://i.pravatar.cc/150?u=vikram" },
  { id: 6, name: "Kavita Rao", company: "Netflix", package: "48 LPA", role: "Backend Developer", image: "https://i.pravatar.cc/150?u=kavita" },
  { id: 7, name: "Arjun Das", company: "Apple", package: "55 LPA", role: "iOS Developer", image: "https://i.pravatar.cc/150?u=arjun" },
  { id: 8, name: "Meera Iyer", company: "Uber", package: "35 LPA", role: "Frontend Engineer", image: "https://i.pravatar.cc/150?u=meera" },
  { id: 9, name: "Siddharth Jain", company: "Goldman Sachs", package: "32 LPA", role: "Analyst", image: "https://i.pravatar.cc/150?u=sid" },
  { id: 10, name: "Ananya Gupta", company: "Salesforce", package: "30 LPA", role: "QA Engineer", image: "https://i.pravatar.cc/150?u=ananya" },
  { id: 11, name: "Rohan Varma", company: "Atlassian", package: "44 LPA", role: "Site Reliability Engineer", image: "https://i.pravatar.cc/150?u=rohan" },
  { id: 12, name: "Ishani Bose", company: "Intuit", package: "28 LPA", role: "Full Stack Developer", image: "https://i.pravatar.cc/150?u=ishani" },
  { id: 13, name: "Aditya Nair", company: "Oracle", package: "26 LPA", role: "Database Admin", image: "https://i.pravatar.cc/150?u=aditya" },
  { id: 14, name: "Tanvi Mehta", company: "Cisco", package: "24 LPA", role: "Network Engineer", image: "https://i.pravatar.cc/150?u=tanvi" },
  { id: 15, name: "Yash Desai", company: "PayPal", package: "22 LPA", role: "Security Researcher", image: "https://i.pravatar.cc/150?u=yash" },
  { id: 16, name: "Zoya Khan", company: "LinkedIn", package: "36 LPA", role: "Software Engineer", image: "https://i.pravatar.cc/150?u=zoya" },
  { id: 17, name: "Karan Malhotra", company: "IBM", package: "20 LPA", role: "Application Developer", image: "https://i.pravatar.cc/150?u=karan" },
  { id: 18, name: "Ritu Phogat", company: "Walmart", package: "25 LPA", role: "DevOps Engineer", image: "https://i.pravatar.cc/150?u=ritu" },
  { id: 19, name: "Varun Dhawan", company: "Flipkart", package: "28 LPA", role: "Software Engineer", image: "https://i.pravatar.cc/150?u=varun" },
  { id: 20, name: "Deepika Padukone", company: "Zomato", package: "30 LPA", role: "Frontend Developer", image: "https://i.pravatar.cc/150?u=deepika" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

export default function TopStudents() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-18 xl:ml-18 flex-1">
        
        <div className="mx-auto mt-16 max-w-6xl px-4 py-8 lg:mt-0">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <h1 className="bg-linear-to-r mb-4 from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-4xl font-extrabold text-transparent">
              Codegnan's Hall of Fame
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Celebrating our top 20 students who achieved incredible placements at global tech giants. 
              Inspiring the next generation of tech leaders.
            </p>
            <div className="mt-8 flex justify-center gap-8">
                <div className="flex flex-col items-center">
                    <Award className="mb-2 h-8 w-8 text-yellow-500" />
                    <span className="text-sm font-semibold text-gray-700">Top Placements</span>
                </div>
                <div className="flex flex-col items-center">
                    <Briefcase className="mb-2 h-8 w-8 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-700">Fortune 500</span>
                </div>
                <div className="flex flex-col items-center">
                    <TrendingUp className="mb-2 h-8 w-8 text-green-500" />
                    <span className="text-sm font-semibold text-gray-700">High Packages</span>
                </div>
            </div>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {students.map((student, index) => (
              <motion.div
                key={student.id}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:shadow-xl"
              >
                <div className="bg-linear-to-r h-3 from-blue-500 via-purple-500 to-pink-500" />
                <div className="flex flex-col items-center p-6 text-center">
                  <div className="relative mb-4">
                    <img 
                      src={student.image} 
                      alt={student.name} 
                      className="h-24 w-24 rounded-full border-4 border-gray-50 object-cover shadow-sm"
                    />
                    <div className="absolute -bottom-2 -right-2 rounded-full border border-gray-100 bg-white p-1 shadow-md">
                        <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-bold text-yellow-700">
                            <Award size={10} /> #{index + 1}
                        </span>
                    </div>
                  </div>
                  
                  <h3 className="mb-1 text-xl font-bold text-gray-800">{student.name}</h3>
                  <p className="mb-4 flex items-center gap-1 text-sm font-medium text-blue-600">
                    <GraduationCap size={14} /> {student.role}
                  </p>
                  
                  <div className="mt-auto w-full space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                      <div className="text-left">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Company</p>
                        <p className="text-sm font-bold text-gray-700">{student.company}</p>
                      </div>
                      <Briefcase className="text-gray-300" size={18} />
                    </div>
                    
                    <div className="flex items-center justify-between rounded-xl bg-pink-50 p-3">
                      <div className="text-left">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-pink-400">Package</p>
                        <p className="text-sm font-bold text-pink-600">{student.package}</p>
                      </div>
                      <TrendingUp className="text-pink-200" size={18} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center text-sm text-gray-400"
          >
            © 2026 Codegnan Placement Cell. All rights reserved.
          </motion.div>
        </div>
      </div>
    </div>
  );
}
