'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import axios from "axios";

interface Review {
    id: string;
    comment: string;
    course: {
        name: string;
    };
    user: {
        name: string;
    };
    rating: number;
    createdAt: string;
};

interface newReview {
    newNameCourse: string;
    newContent: string;
    newRating: number;
};

interface Course {
    id: string;
    name: string;
};

export default function Page() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [newReview, setNewReview] = useState({
        newNameCourse: "",
        newContent: "",
        newRating: 0,
    })
    const [countdown, setCountdown] = useState(3);
    const [showModal, setShowModal] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [dataEdit, setDataEdit] = useState({
        editCourseId: "",
        editCourse: "",
        editContent: "",
        editRating: 0
    })

    const [allCourse, setallCourse] = useState<Course[]>([]);
    const [suggestions, setSuggestions] = useState<Course[]>([])

    const handleEditModal = (review: Review) => {
        setDataEdit({
            editCourseId: review.id,
            editCourse: review.course.name,
            editContent: review.comment,
            editRating: review.rating
        });
        setShowEditModal(true);
    };


    console.log(session?.user.id);



    // fatchdata
    const fetchReview = async () => {
        //cheak session user id
        if (!session?.user?.id) {
            console.warn("Session is not ready or does not have a user ID.");
            return;
        }

        try {
            const response = await axios.get<Review[]>(`/api/review/${session.user.id}`);
            console.log("✅ Pulled reviews:", response.data);
            setReviews(response.data);
        } catch (error) {
            console.error("❌ Error occurred while fetching reviews.:", error);
        }
    };

    const fetchAllcourse = async () => {
        try {
            const response = await axios.get<Course[]>("/api/course");
            setallCourse(response.data);
            // console.log(allCourse);

        } catch (error) {
            console.error("❌ Error occurred while fetching reviews.:", error);
        }
    };



    const handleDelete = async (Id: string) => {
        // console.log(courseId);

        try {
            if (!session?.user?.id) {
                console.warn("Session is not ready or does not have a user ID.");
                return;
            }
            await axios.delete(`/api/review/${session.user.id}?reviewId=${Id}`);
            fetchReview();
        }
        catch (error) {
            console.error("Error deleting the review.: ", error);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewReview(prevState => ({ ...prevState, [name]: value }));

        // ถ้ากรอกชื่อคอร์ส
        if (name === "newNameCourse") {
            if (value.trim() === "") {
                setSuggestions([]);  // ถ้าชื่อคอร์สว่าง ก็ให้ซ่อนคำแนะนำ
            } else {
                // กรองชื่อคอร์สที่ตรงกับค่าที่พิมพ์
                const filteredSuggestions = allCourse.filter(course =>
                    course.name && course.name.toLowerCase().includes(value.toLowerCase())
                );

                setSuggestions(filteredSuggestions);
                // แสดงผลลัพธ์ที่กรองแล้ว
            }
        }
    };

    const handleSelect = (courseName: string) =>{
        setNewReview(prevState => ({ ...prevState, newNameCourse: courseName }));
        setSuggestions([]);
    }

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDataEdit((prev) => ({
            ...prev,
            [name]: name === "editRating" ? Number(value) : value,
        }));
    }

    const handleSubmitEdit = async (id: string) => {
        try {
            if (!session?.user?.id) {
                console.warn("Session is not ready or does not have a user ID.");
                return;
            }

            await axios.put(`/api/review/${session.user.id}`, {
                reviewId: id,
                rating: dataEdit.editRating,
                comment: dataEdit.editContent
            });

            fetchReview();
            setShowEditModal(false);
            setDataEdit({
                editCourseId: id,
                editCourse: "",
                editContent: "",
                editRating: 0
            });
        }
        catch (error) {
            console.error("Error updating the review.: ", error);
        }
    };

    useEffect(() => {
        if (status === "loading") return;
        if (status === "unauthenticated") {
            router.push("/signin");
        } else if (status === "authenticated" && session?.user?.id) {
            console.log("Fetching reviews...");
            fetchAllcourse();
            fetchReview();
        }
    }, [status, session?.user?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user?.id) {
            console.warn("Session is not ready or does not have a user ID.");
            return;
        }

        try {
            await axios.post(`/api/review/${session.user.id}`, {
                course_name: newReview.newNameCourse,
                rating: Number(newReview.newRating),
                content: newReview.newContent,
            });

            setShowModal(true);
            setCountdown(3);
            setNewReview({
                newNameCourse: "",
                newContent: "",
                newRating: 0,
            })

            fetchReview();
            fetchAllcourse();
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev === 1) {
                        clearInterval(timer);
                        setShowModal(false);
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        catch (error) {
            console.error("Error saving the review.: ", error);
        }
    }
    return (
        status === 'authenticated' &&
        session?.user && (
            <div className="mt-20 bg-white p-8 max-w-3xl mx-auto rounded-lg">

                {/* input form */}
                <div className="max-w-3xl mx-auto  p-6 bg-gray-800 shadow-lg rounded-lg text-white">
                    <h1 className="text-4xl font-bold text-center mb-6">✍️ Write my review</h1>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {/* course */}
                        <div className="relative">
                            <label className="block text-lg font-semibold mb-2">📚 Course name</label>
                            <input
                                className="w-full p-3 border border-gray-700 rounded-md bg-white text-black focus:ring-2 focus:ring-gray-600"
                                type="text"
                                placeholder="Enter the course name"
                                name="newNameCourse"
                                value={newReview.newNameCourse}
                                onChange={handleChange}
                            />
                            {suggestions.length > 0 && (
                                <ul className="absolute left-0 w-full bg-white border border-gray-700 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto z-10 mt-2">
                                    {suggestions.map((course: Course) => (
                                        <li
                                            key={course.id}
                                            className="text-lg p-3 hover:bg-gray-100 cursor-pointer text-black transition duration-200"
                                            onClick={() => handleSelect(course.name)}
                                        >
                                            {course.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>


                        {/* content */}
                        <div>
                            <label className="block text-lg font-semibold mb-1">📝 Comment</label>
                            <textarea
                                className="w-full p-3 border border-gray-700 rounded bg-white text-black h-40"
                                placeholder="Write your review here...."
                                name="newContent"
                                value={newReview.newContent}
                                onChange={handleChange}

                            />
                        </div>
                        {/* rating */}
                        <div>
                            <label className="block text-lg font-semibold mb-1">⭐ Rate (0-5)</label>
                            <input
                                className="w-full p-3 border border-gray-700 rounded bg-white text-black"
                                type="number"
                                min="1"
                                max="5"
                                placeholder="Rate (1-5)"
                                name="newRating"
                                value={newReview.newRating}
                                onChange={handleChange}
                            />
                        </div>
                        <button type="submit"
                            className="bg-gray-600 hover:bg-blue-500 text-xl font-bold p-3 text-center w-full text-white rounded transition duration-200"
                        >
                            ➕ Add review
                        </button>
                    </form>
                </div>

                {/* show myReview */}
                <h2 className="mt-5 text-3xl font-bold text-gray-800 mb-4">My review</h2>
                {reviews.length > 0 ? (
                    reviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-4 mb-4 shadow-md">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                    {review.course?.name
                                        ? review.course.name.charAt(0).toUpperCase() + review.course.name.slice(1)
                                        : 'unknown course'}
                                </span>
                                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                    ⭐{review.rating}/5
                                </span>
                            </div>

                            <p className="text-gray-700 text-base mb-2">{review.comment}</p>

                            <p className="text-sm text-gray-500">
                                Reviewed on {new Date(review.createdAt).toLocaleDateString('th-TH', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                By {review.user?.name || 'unknown user'}
                            </span>
                            {/* buutton */}
                            <div className="flex justify-center mt-2">
                                <button className="rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white py-1 mx-2 w-1/2"
                                    onClick={() => handleEditModal(review)}
                                >
                                    ✏️ Edit
                                </button>
                                <button className="rounded-lg bg-red-500 hover:bg-red-600 text-white py-1 mx-2 w-1/2"
                                    onClick={() => handleDelete(review.id)}
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center">No reviews </p>
                )}

                {/* Modal inputdata Popup */}
                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                            <h2 className="text-xl font-bold text-green-600">✅ Review completed!</h2>
                            <p className="text-gray-600">window will close in {countdown} second...</p>
                        </div>
                    </div>
                )}

                {/* Modal Edit Popup */}
                {showEditModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white p-6 rounded-2xl shadow-xl w-[700px] h-[500px] max-w-[90%] transform transition-all duration-300">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Edit review</h2>

                            <label className="block text-gray-700 font-semibold">Course name:</label>
                            <p className="bg-gray-100 text-gray-800 p-2 rounded-lg">{dataEdit.editCourse}</p>

                            <label className="block mt-4 text-gray-700 font-semibold">Your review</label>
                            <textarea
                                className="w-full p-3 border border-gray-300 rounded-lg mt-2 text-black focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none"
                                name="editContent"
                                value={dataEdit.editContent}
                                onChange={handleEditChange}
                                rows={4}
                            ></textarea>

                            <label className="block mt-4 text-gray-700 font-semibold">⭐ Rate (0-5)</label>
                            <input
                                className="w-full p-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                type="number" min="0" max="5"
                                value={dataEdit.editRating}
                                name="editRating"
                                onChange={handleEditChange}
                            />

                            <div className="flex justify-between mt-6">
                                <button
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-200 mx-1"
                                    onClick={() => handleSubmitEdit(dataEdit.editCourseId)}
                                >
                                    ✅ confirm
                                </button>
                                <button
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 mx-1"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    ❌ cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    );
}
`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               `