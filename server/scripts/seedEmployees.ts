import mongoose from 'mongoose';
import EmployeeMaster from '../models/EmployeeMaster';
import { ensureConnection } from '../db/connection';

// Helper function to parse DD-MM-YYYY date format
const parseDate = (dateStr: string | undefined) => {
  if (!dateStr || dateStr === '') return undefined;
  if (dateStr.includes('-') && dateStr.length === 10) {
    const [day, month, year] = dateStr.split('-');
    return new Date(`${year}-${month}-${day}`);
  }
  return new Date(dateStr);
};

const sampleEmployees = [
    {
        emp_id: "E1001",
        emp_name: "KATHIR",
        location: "Corporate",
        dept_id: "MGT",
        gender: "M",
        grade_id: "DIR",
        team: "EX",
        category: "Regular",
        pf_no: "",
        esi_no: "",
        doj: undefined,
        dol: undefined,
        remarks: "",
        address: "",
        mobile_no: "",
        dob: undefined,
        age: 55,
        married: true,
        blood_group: "",
        education: "",
        emp_photo: "",
        status: "Active",
        active: true,
    },
    {
        emp_id: "E1002",
        emp_name: "NIKIL",
        location: "Corporate",
        dept_id: "MGT",
        gender: "M",
        grade_id: "DIR",
        team: "EX",
        category: "Regular",
        pf_no: "",
        esi_no: "",
        doj: undefined,
        dol: undefined,
        remarks: "",
        address: "",
        mobile_no: "",
        dob: undefined,
        age: 26,
        married: false,
        blood_group: "",
        education: "",
        emp_photo: "",
        status: "Active",
        active: true,
    },
    {
        emp_id: "E1003",
        emp_name: "KARTHIK",
        location: "Corporate",
        dept_id: "ADM",
        gender: "M",
        grade_id: "MGR",
        team: "EX",
        category: "Regular",
        pf_no: "",
        esi_no: "",
        doj: undefined,
        dol: parseDate("25-12-2025"),
        remarks: "",
        address: "",
        mobile_no: "",
        dob: undefined,
        age: 30,
        married: true,
        blood_group: "",
        education: "",
        emp_photo: "",
        status: "Exited",
        active: true,
    },
    {
        emp_id: "E1004",
        emp_name: "KALAIVANI",
        location: "Factory",
        dept_id: "PR1",
        gender: "F",
        grade_id: "OPR",
        team: "T2",
        category: "Contract",
        pf_no: "",
        esi_no: "",
        doj: undefined,
        dol: undefined,
        remarks: "",
        address: "",
        mobile_no: "",
        dob: undefined,
        age: 32,
        married: true,
        blood_group: "",
        education: "",
        emp_photo: "",
        status: "Active",
        active: true,
    },
    {
        emp_id: "E1005",
        emp_name: "SURESH",
        location: "Factory",
        dept_id: "PR2",
        gender: "M",
        grade_id: "OPR",
        team: "T1",
        category: "Contract",
        pf_no: "",
        esi_no: "",
        doj: undefined,
        dol: parseDate("25-12-2025"),
        remarks: "",
        address: "",
        mobile_no: "",
        dob: undefined,
        age: 27,
        married: true,
        blood_group: "",
        education: "",
        emp_photo: "",
        status: "Exited",
        active: true,
    },
];

async function seedEmployees() {
    try {
        await ensureConnection();
        console.log('Connected to database');

        for (const employeeData of sampleEmployees) {
            const employee = await EmployeeMaster.findOneAndUpdate(
                { emp_id: employeeData.emp_id },
                {
                    ...employeeData,
                    last_modified_user_id: 'ADMIN',
                    last_modified_date_time: new Date(),
                },
                { upsert: true, new: true, runValidators: true }
            );
            console.log(`Employee ${employee.emp_id} - ${employee.emp_name} added/updated`);
        }

        console.log('All employees seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding employees:', error);
        process.exit(1);
    }
}

seedEmployees();



