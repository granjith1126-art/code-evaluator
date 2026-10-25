import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.models.entities import Problem, TestCase, User, Submission, Rubric
from app.core.security import hash_password
from app.evaluators.deterministic import deterministic_evaluator

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Checking if database already seeded...")
    existing_problems = db.query(Problem).count()
    if existing_problems > 0:
        print(f"Database already contains {existing_problems} problems. Skipping initial seed.")
        db.close()
        return

    print("Seeding default users...")
    admin_user = User(
        username="admin",
        email="admin@evaluator.local",
        hashed_password=hash_password("admin1234"),
        role="admin"
    )
    reviewer_user = User(
        username="reviewer_sarah",
        email="sarah@evaluator.local",
        hashed_password=hash_password("reviewer1234"),
        role="reviewer"
    )
    db.add_all([admin_user, reviewer_user])
    db.flush()

    print("Seeding default rubric...")
    rubric = Rubric(
        name="Production Python Code Evaluation Rubric",
        version="1.0.0",
        criteria_weights={
            "correctness": 0.35,
            "efficiency": 0.20,
            "readability": 0.20,
            "maintainability": 0.15,
            "security": 0.10
        },
        description="Comprehensive evaluation rubric assessing functional correctness, time/space efficiency, idiomatic style, maintainability, and security safeguards.",
        is_active=True
    )
    db.add(rubric)

    print("Seeding coding problems and test suites...")

    # Problem 1: Two Sum
    p1 = Problem(
        title="Two Sum",
        slug="two-sum",
        description="""Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.""",
        difficulty="easy",
        time_limit_seconds=2.0,
        memory_limit_mb=128,
        tags="Array,Hash Table",
        function_name="two_sum",
        function_signature="def two_sum(nums: list[int], target: int) -> list[int]:",
        starter_code="""def two_sum(nums: list[int], target: int) -> list[int]:
    # Your solution here
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
""",
        input_format="JSON array with [nums, target]",
        output_format="JSON list with [index1, index2]",
        constraints="2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9, Only one valid answer exists."
    )
    db.add(p1)
    db.flush()

    p1_tests = [
        TestCase(problem_id=p1.id, input_data="[[2, 7, 11, 15], 9]", expected_output="[0, 1]", is_hidden=False, explanation="2 + 7 = 9", weight=1.0, order_index=0),
        TestCase(problem_id=p1.id, input_data="[[3, 2, 4], 6]", expected_output="[1, 2]", is_hidden=False, explanation="2 + 4 = 6", weight=1.0, order_index=1),
        TestCase(problem_id=p1.id, input_data="[[3, 3], 6]", expected_output="[0, 1]", is_hidden=False, explanation="Duplicates handling", weight=1.0, order_index=2),
        TestCase(problem_id=p1.id, input_data="[[-1, -2, -3, -4, -5], -8]", expected_output="[2, 4]", is_hidden=True, explanation="Negative numbers", weight=2.0, order_index=3),
        TestCase(problem_id=p1.id, input_data="[[0, 4, 3, 0], 0]", expected_output="[0, 3]", is_hidden=True, explanation="Zero values", weight=2.0, order_index=4)
    ]
    db.add_all(p1_tests)

    # Problem 2: Valid Palindrome
    p2 = Problem(
        title="Valid Palindrome",
        slug="valid-palindrome",
        description="""A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.""",
        difficulty="easy",
        time_limit_seconds=2.0,
        memory_limit_mb=128,
        tags="String,Two Pointers",
        function_name="is_palindrome",
        function_signature="def is_palindrome(s: str) -> bool:",
        starter_code="""def is_palindrome(s: str) -> bool:
    # Your solution here
    filtered = [c.lower() for c in s if c.isalnum()]
    return filtered == filtered[::-1]
""",
        input_format="JSON array with [s]",
        output_format="Boolean true or false",
        constraints="1 <= s.length <= 2 * 10^5, s consists only of printable ASCII characters."
    )
    db.add(p2)
    db.flush()

    p2_tests = [
        TestCase(problem_id=p2.id, input_data='["A man, a plan, a canal: Panama"]', expected_output="true", is_hidden=False, explanation="Standard palindrome", weight=1.0, order_index=0),
        TestCase(problem_id=p2.id, input_data='["race a car"]', expected_output="false", is_hidden=False, explanation="Not a palindrome", weight=1.0, order_index=1),
        TestCase(problem_id=p2.id, input_data='[" "]', expected_output="true", is_hidden=False, explanation="Empty string after filtering", weight=1.0, order_index=2),
        TestCase(problem_id=p2.id, input_data='["0P"]', expected_output="false", is_hidden=True, explanation="Number and letter", weight=2.0, order_index=3),
        TestCase(problem_id=p2.id, input_data='["ab_a"]', expected_output="true", is_hidden=True, explanation="Underscore handling", weight=2.0, order_index=4)
    ]
    db.add_all(p2_tests)

    # Problem 3: Longest Substring Without Repeating Characters
    p3 = Problem(
        title="Longest Substring Without Repeating Characters",
        slug="longest-substring-without-repeating",
        description="""Given a string `s`, find the length of the longest substring without repeating characters.""",
        difficulty="medium",
        time_limit_seconds=2.0,
        memory_limit_mb=128,
        tags="String,Sliding Window,Hash Table",
        function_name="length_of_longest_substring",
        function_signature="def length_of_longest_substring(s: str) -> int:",
        starter_code="""def length_of_longest_substring(s: str) -> int:
    # Your solution here
    used = {}
    max_len = 0
    left = 0
    for right, char in enumerate(s):
        if char in used and left <= used[char]:
            left = used[char] + 1
        else:
            max_len = max(max_len, right - left + 1)
        used[char] = right
    return max_len
""",
        input_format="JSON array with [s]",
        output_format="Integer length",
        constraints="0 <= s.length <= 5 * 10^4"
    )
    db.add(p3)
    db.flush()

    p3_tests = [
        TestCase(problem_id=p3.id, input_data='["abcabcbb"]', expected_output="3", is_hidden=False, explanation="'abc' has length 3", weight=1.0, order_index=0),
        TestCase(problem_id=p3.id, input_data='["bbbbb"]', expected_output="1", is_hidden=False, explanation="'b' has length 1", weight=1.0, order_index=1),
        TestCase(problem_id=p3.id, input_data='["pwwkew"]', expected_output="3", is_hidden=False, explanation="'wke' has length 3", weight=1.0, order_index=2),
        TestCase(problem_id=p3.id, input_data='[""]', expected_output="0", is_hidden=True, explanation="Empty string edge case", weight=2.0, order_index=3),
        TestCase(problem_id=p3.id, input_data='["tmmzuxt"]', expected_output="5", is_hidden=True, explanation="'mzuxt' has length 5", weight=2.0, order_index=4)
    ]
    db.add_all(p3_tests)

    # Problem 4: Merge Intervals
    p4 = Problem(
        title="Merge Intervals",
        slug="merge-intervals",
        description="""Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.""",
        difficulty="medium",
        time_limit_seconds=2.0,
        memory_limit_mb=128,
        tags="Array,Sorting",
        function_name="merge",
        function_signature="def merge(intervals: list[list[int]]) -> list[list[int]]:",
        starter_code="""def merge(intervals: list[list[int]]) -> list[list[int]]:
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for current in intervals[1:]:
        prev = merged[-1]
        if current[0] <= prev[1]:
            prev[1] = max(prev[1], current[1])
        else:
            merged.append(current)
    return merged
""",
        input_format="JSON array with [intervals]",
        output_format="JSON array of merged intervals",
        constraints="1 <= intervals.length <= 10^4, intervals[i].length == 2"
    )
    db.add(p4)
    db.flush()

    p4_tests = [
        TestCase(problem_id=p4.id, input_data="[[[1, 3], [2, 6], [8, 10], [15, 18]]]", expected_output="[[1, 6], [8, 10], [15, 18]]", is_hidden=False, weight=1.0, order_index=0),
        TestCase(problem_id=p4.id, input_data="[[[1, 4], [4, 5]]]", expected_output="[[1, 5]]", is_hidden=False, weight=1.0, order_index=1),
        TestCase(problem_id=p4.id, input_data="[[[1, 4], [0, 4]]]", expected_output="[[0, 4]]", is_hidden=True, explanation="Unsorted input", weight=2.0, order_index=2),
        TestCase(problem_id=p4.id, input_data="[[[1, 4], [2, 3]]]", expected_output="[[1, 4]]", is_hidden=True, explanation="Contained interval", weight=2.0, order_index=3)
    ]
    db.add_all(p4_tests)

    # Problem 5: Search in Rotated Sorted Array
    p5 = Problem(
        title="Search in Rotated Sorted Array",
        slug="search-in-rotated-sorted-array",
        description="""There is an integer array `nums` sorted in ascending order (with distinct values). Prior to being passed to your function, `nums` is possibly rotated at an unknown pivot index `k`.

Given the array `nums` after the possible rotation and an integer `target`, return the index of `target` if it is in `nums`, or `-1` if it is not in `nums`.

You must write an algorithm with `O(log n)` runtime complexity.""",
        difficulty="hard",
        time_limit_seconds=2.0,
        memory_limit_mb=128,
        tags="Array,Binary Search",
        function_name="search",
        function_signature="def search(nums: list[int], target: int) -> int:",
        starter_code="""def search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        if nums[left] <= nums[mid]:
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else:
            if nums[mid] < target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1
    return -1
""",
        input_format="JSON array with [nums, target]",
        output_format="Integer index or -1",
        constraints="1 <= nums.length <= 5000, -10^4 <= nums[i] <= 10^4, All values are unique."
    )
    db.add(p5)
    db.flush()

    p5_tests = [
        TestCase(problem_id=p5.id, input_data="[[4, 5, 6, 7, 0, 1, 2], 0]", expected_output="4", is_hidden=False, weight=1.0, order_index=0),
        TestCase(problem_id=p5.id, input_data="[[4, 5, 6, 7, 0, 1, 2], 3]", expected_output="-1", is_hidden=False, weight=1.0, order_index=1),
        TestCase(problem_id=p5.id, input_data="[[1], 0]", expected_output="-1", is_hidden=False, weight=1.0, order_index=2),
        TestCase(problem_id=p5.id, input_data="[[1, 3], 3]", expected_output="1", is_hidden=True, weight=2.0, order_index=3),
        TestCase(problem_id=p5.id, input_data="[[5, 1, 3], 5]", expected_output="0", is_hidden=True, weight=2.0, order_index=4)
    ]
    db.add_all(p5_tests)

    db.commit()
    print("Database successfully seeded with 5 coding problems and 22 test cases!")
    db.close()

if __name__ == "__main__":
    seed_database()
