package trust.web3provider;

import android.content.res.Resources;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.widget.TextView;

import java.io.InputStream;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        try {
            Resources res = getResources();
            InputStream in = res.openRawResource(trust.web3provider.R.raw.trust);

            byte[] b = new byte[in.available()];
            int readLen = in.read(b);
            ((TextView) findViewById(R.id.out)).setText(String.format("Len: %1$s\n%2$s", readLen, new String(b)));
        } catch (Exception e) {
            ((TextView) findViewById(R.id.out)).setText(e.getMessage());
        }
    }
}
