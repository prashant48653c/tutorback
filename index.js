const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const PORT = 4000;
const prisma = new PrismaClient();
// Enable CORS for your frontend (adjust origin as needed)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH"],
  })
);
app.use("/uploads", express.static("uploads"));

// To parse JSON bodies (for login route)
app.use(express.json());

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Make sure this folder exists or create it
  },
  filename: function (req, file, cb) {
    // Save files with original name + timestamp for uniqueness
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Signup route - accepts images 'image1' and 'image2'
app.post(
  "/signup",
  upload.fields([{ name: "image1" }, { name: "image2" }]),
  async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    console.log(firstName);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Save user with file paths
    const image1 = `${process.env.BASE_URL}/${
      req.files["image1"] ? req.files["image1"][0].path : ""
    }`;
    const image2 = `${process.env.BASE_URL}/${
      req.files["image2"] ? req.files["image2"][0].path : ""
    }`;
    const localUser = {
      name: firstName + " " + lastName,
      email,
      password,
      image1,
      image2,
    };

    try {
      const user = await prisma.user.create({
        data: localUser,
      });

      res.status(201).json({ message: "Signup successful", user: user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error creating user",data:error  });
    }
  }
);

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Missing email or password" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login successful", user: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error logging in",data:error  });
  }
});

app.post(
  "/project",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        userId,
        projectName,
        gap,
        totalNumbers,
        currentState,
        handledBy,
        adminId
      } = req.body;
      const id = parseInt(userId);
const aId=parseInt(adminId);
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(401).json({ message: "Invalid User" });
      }
      console.log(req.files)

      const image1 = `${process.env.BASE_URL}/${
        req.files["image1"] ? req.files["image1"][0].path : ""
      }`;
      const image2 = `${process.env.BASE_URL}/${
        req.files["image2"] ? req.files["image2"][0].path : ""
      }`;

      const project = await prisma.project.create({
        data: {
          projectName,
          gap: gap.toString(),
          totalNumbers,
          currentState: parseInt(currentState),
          userId: id,
          image1,
          image2,
          handledBy,
          assignedBy:aId,


        },
      });

      res.json({ message: "Project creation successful", project });
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(500).json({ message: "Internal server error", data:error });
    }
  }
);

// Update the project currentState
app.patch("/project/:id", async (req, res) => {
  const id = parseInt(req.params.id);
    
  const {
    currentState,
    pauseAt,
    note,
    passedTime,
    handledBy,
    projectName,
    gap,
    
  } = req.body;

  // Prepare data object dynamically
  const dataToUpdate = {};

  dataToUpdate.currentState = parseInt(currentState);
  dataToUpdate.passedTime = passedTime;
  dataToUpdate.handledBy = handledBy;
  dataToUpdate.projectName = projectName;
  dataToUpdate.gap = gap;
  
  // Only create pauseNote if both fields exist
  if (pauseAt !== undefined && note) {
    dataToUpdate.pauseNotes = {
      create: {
        pausedAt: pauseAt,
        note: note,
      },
    };
  }
  console.log(dataToUpdate);
  try {
    const updatedProject = await prisma.project.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({ project: updatedProject });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Internal server error",data:error });
  }
});

app.patch("/project/active/:id",upload.fields([ { name: "completionImage", maxCount: 1 }]), async (req, res) => {
  const id = parseInt(req.params.id);
     const image = `${process.env.BASE_URL}/${
        req.files["completionImage"] ? req.files["completionImage"][0].path : ""
      }`;
      if(!image){
        return res.json({message:"Image is required"});
      }
  const {
    currentState,
    pauseAt,
    note,
    passedTime,
    handledBy,
    projectName,
    gap,
    status
  } = req.body;

  // Prepare data object dynamically
  const dataToUpdate = {};

  dataToUpdate.currentState = parseInt(currentState);
  dataToUpdate.passedTime = passedTime;
  dataToUpdate.handledBy = handledBy;
  dataToUpdate.projectName = projectName;
  dataToUpdate.gap = gap;
  dataToUpdate.status=status;
  dataToUpdate.resultProof=image
  // Only create pauseNote if both fields exist
  if (pauseAt !== undefined && note) {
    dataToUpdate.pauseNotes = {
      create: {
        pausedAt: pauseAt,
        note: note,
      },
    };
  }
  console.log(dataToUpdate);
  try {
    const updatedProject = await prisma.project.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({ project: updatedProject });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/projects/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const search = req.query.search || "";
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get total count for pagination info
    const totalCount = await prisma.project.count({
      where: {
        userId,
        projectName: search
          ? {
              contains: search,
              mode: "insensitive",
            }
          : undefined, // this is OK
      },
    });

    const projects = await prisma.project.findMany({
      where: {
        userId,
        ...(search && {
          projectName: {
            contains: search,
            mode: "insensitive",
          },
        }),
      },
      skip,
      take: pageSize,
      include: { pauseNotes: true },
      orderBy: { id: "desc" },
    });

    res.json({
      projects,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all users except admin
app.post("/users", async (req, res) => {
  try {
    console.log("Haha ",req.body)
    const id = req.body.id;
    console.log(id)

    const user = await prisma.user.findFirst({
      where: { id: parseInt(id) },
    });
    console.log(user)

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role != "ADMIN") {
      return res.status(404).json({ message: "Admin can access this route" });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role:true,
        email:true,
        projects:true
      },
    });

    return res.status(200).json({data:users,message:"User retrived succesfully!"})

  } catch (error) {
    console.log("Error ", error);
    return res.status(404).json({ message: error.message });
  }
});

// Submit the result image
app.patch("/submission",  upload.fields([ { name: "image" }]),async(req,res)=>{
  try {
    const {projectId,userId,totalTime}=req.body;
     const image = `${process.env.BASE_URL}/${
      req.files["image"] ? req.files["image"][0].path : ""
    }`;

    const project = await prisma.project.findFirst({
      where:{
        id:parseInt(projectId)
      }
    });
    if(!project){
     return res.status(500).json({ message: 'Project not found!' });
    }

     if(project.userId != parseInt(userId)){
     return res.status(500).json({ message: 'Project not created by user!' });
    }
    await prisma.project.update({
      where:{
        id:parseInt(projectId),
        resultProof:image,
        status:"UNDERREVIEW"

      }
    })

    return res.status(201).json({message:"Image have been submitted!"})
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: error.message });
  }
})

// Change status of project
app.patch("/change-status",async(req,res)=>{
  try {
    const {projectId,userId,status}=req.body;
    

    const project = await prisma.project.findFirst({
      where:{
        id:parseInt(projectId)
      }
    });
    if(!project){
     return res.status(500).json({ message: 'Project not found!' });
    }

     if(project.assignedBy != parseInt(userId)){
     return res.status(500).json({ message: 'Only admin can change status!' });
    }
    await prisma.project.update({
      where:{
        id:parseInt(projectId),
      },
      data:{
         status:status
      }
    })

    return res.status(201).json({message:"Image have been submitted!"})
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: error.message });
  }
})


// Get all projects (Admin only)
app.get("/admin/projects", async (req, res) => {
  try {
    const { adminId, page = 1, search = "" } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    const admin = await prisma.user.findFirst({
      where: { id: parseInt(adminId) },
    });

    // if (!admin || admin.role !== "ADMIN") {
    //   return res.status(403).json({ message: "Admin access required" });
    // }

    const where = search
      ? {
          OR: [
            { projectName: { contains: search, mode: "insensitive" } },
            { handledBy: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          pauseNotes: true,
        },
        orderBy: { id: "desc" },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      projects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
