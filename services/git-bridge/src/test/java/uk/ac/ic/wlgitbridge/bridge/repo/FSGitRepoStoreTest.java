package uk.ac.ic.wlgitbridge.bridge.repo;

import org.apache.commons.io.FileUtils;
import org.junit.Before;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import uk.ac.ic.wlgitbridge.util.Files;

import java.io.*;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;

import static org.junit.Assert.*;

/**
 * Created by winston on 23/08/2016.
 */
public class FSGitRepoStoreTest {

    public static File makeTempRepoDir(
            TemporaryFolder tmpFolder,
            String name
    ) throws IOException {
        File tmp = tmpFolder.newFolder(name);
        Path rootdir = Paths.get(
                "src/test/resources/uk/ac/ic/wlgitbridge/"
                        + "bridge/repo/FSGitRepoStoreTest/rootdir"
        );
        FileUtils.copyDirectory(rootdir.toFile(), tmp);
        Files.renameAll(tmp, "DOTgit", ".git");
        return tmp;
    }

    private FSGitRepoStore repoStore;
    private File original;

    @Before
    public void setup() throws IOException {
        TemporaryFolder tmpFolder = new TemporaryFolder();
        tmpFolder.create();
        File tmp = makeTempRepoDir(tmpFolder, "rootdir");
        original = tmpFolder.newFolder("original");
        FileUtils.copyDirectory(tmp, original);
        repoStore = new FSGitRepoStore(tmp.getAbsolutePath());
    }

    @Test
    public void testPurgeNonexistentProjects() {
        File toDelete = new File(repoStore.getRootDirectory(), "idontexist");
        File wlgb = new File(repoStore.getRootDirectory(), ".wlgb");
        assertTrue(toDelete.exists());
        assertTrue(wlgb.exists());
        repoStore.purgeNonexistentProjects(Arrays.asList("proj1", "proj2"));
        assertFalse(toDelete.exists());
        assertTrue(wlgb.exists());
    }

    @Test
    public void totalSizeShouldChangeWhenFilesAreCreatedAndDeleted()
            throws IOException {
        long old = repoStore.totalSize();
        repoStore.remove("proj1");
        long new_ = repoStore.totalSize();
        assertTrue(new_ < old);
        try (
                OutputStream out = new FileOutputStream(
                        new File(repoStore.getRootDirectory(), "__temp.txt")
                )
        ) {
            out.write(new byte[1 * 1024 * 1024]);
        }
        long new__ = repoStore.totalSize();
        assertTrue(new__ > new_);
    }

    @Test
    public void zipAndUnzipShouldBeTheSame() throws IOException {
        long beforeSize = repoStore.totalSize();
        InputStream zipped = repoStore.bzip2Project("proj1");
        repoStore.remove("proj1");
        assertTrue(beforeSize > repoStore.totalSize());
        repoStore.unbzip2Project("proj1", zipped);
        assertEquals(beforeSize, repoStore.totalSize());
        assertTrue(
                Files.contentsAreEqual(
                        original,
                        repoStore.getRootDirectory()
                )
        );
    }

}